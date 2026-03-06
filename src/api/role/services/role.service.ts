import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/database/entities/role.entity';
import { AssignRoleDto, ChangeRoleDto } from '../dto/role.dto';
import { UserService } from 'src/api/user/services/user.service';
import { errorMessages } from 'src/errors/custom';
import { RoleIds } from '../enum/role.enum';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
    private readonly userService: UserService,
  ) {}

  async assignRoleToUser(_data: AssignRoleDto) {
    throw new BadRequestException(
      'role.assign is disabled. Use /role/change to set a single role per non-admin user.',
    );
  }

  async changeRoleForUser(data: ChangeRoleDto) {
    if (data.roleId === RoleIds.Admin) {
      throw new BadRequestException('cannot assign Admin role with this action');
    }

    const role = await this.findById(data.roleId);
    const user = await this.userService.findById(data.userId, { roles: true });

    const userIsAdmin = user.roles.some((userRole) => userRole.id === RoleIds.Admin);
    if (userIsAdmin) {
      throw new ForbiddenException(errorMessages.auth.notAllowed);
    }

    await this.userService.replaceRoles(user.id, [role.id]);
    return this.userService.findById(user.id, { roles: true });
  }

  async findAll() {
    return this.rolesRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findById(roleId: number) {
    const role = await this.rolesRepository.findOne({
      where: {
        id: roleId,
      },
    });
    if (!role) {
      throw new NotFoundException(errorMessages.role.notFound);
    }
    return role;
  }
}
