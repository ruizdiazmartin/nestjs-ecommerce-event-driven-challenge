import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UserService } from 'src/api/user/services/user.service';
import { errorMessages } from 'src/errors/custom';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authorizationHeader = request.headers.authorization;
      const bearerToken = authorizationHeader?.startsWith('Bearer ')
        ? authorizationHeader.split(' ')[1]
        : null;
      if (!bearerToken) {
        throw new UnauthorizedException(errorMessages.auth.invlidToken);
      }
      const payload = await this.jwtService.verifyAsync(bearerToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      request.user = await this.userService.findById(payload.id, {
        roles: true,
      });
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError)
        throw new UnauthorizedException(errorMessages.auth.expiredToken);
      throw new UnauthorizedException(errorMessages.auth.invlidToken);
    }
  }
}
