import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../modules/authentication/auth.decorator';
import { JwtPayload } from '../../modules/authentication/interfaces/jwt-payload';
import { JwtUserEntity } from './entities/jwt-user.entity';

@Authenticate('jwt')
@Controller('users')
export class UsersController {
	/** default route to test authenticated access */
	@Get('profile')
	getProfile(@CurrentUser() user: JwtPayload): JwtUserEntity {
		return new JwtUserEntity(user);
	}
}
