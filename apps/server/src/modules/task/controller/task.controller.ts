import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { Authenticate, CurrentUser } from '../../authentication/decorator/auth.decorator';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { TaskUC } from '../uc/task.uc';
import { TaskResponseDto, TaskQueryDto } from './dto';

// TODO: swagger doku do not read from combined query object only from passed single parameter in Query(), but this do not allowed optional querys only required querys

@ApiTags('Task')
@Authenticate('jwt')
@Controller('task')
export class TaskController {
	constructor(private readonly taskUc: TaskUC) {}

	@Get('dashboard')
	async findAll(@CurrentUser() currentUser: ICurrentUser, @Query() query: TaskQueryDto): Promise<TaskResponseDto[]> {
		const response = this.taskUc.findAllOpenForUser(currentUser.userId, query);
		return response;
	}
}