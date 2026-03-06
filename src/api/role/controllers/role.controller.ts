import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from 'src/api/auth/guards/auth.decorator';
import { Serialize } from 'src/common/helper/serialize.interceptor';
import { AssignRoleDto, ChangeRoleDto, RoleListDto } from '../dto/role.dto';
import { RoleIds } from '../enum/role.enum';
import { RoleService } from '../services/role.service';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Auth(RoleIds.Admin)
  @Serialize(RoleListDto)
  @Get()
  async getRoles() {
    return this.roleService.findAll();
  }

  @Auth(RoleIds.Admin)
  @Post('assign')
  async assignRoleToUser(@Body() body: AssignRoleDto) {
    return this.roleService.assignRoleToUser(body);
  }

  @Auth(RoleIds.Admin)
  @Post('change')
  async changeRoleForUser(@Body() body: ChangeRoleDto) {
    return this.roleService.changeRoleForUser(body);
  }
}
