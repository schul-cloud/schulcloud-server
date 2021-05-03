import { PickType } from '@nestjs/swagger';
import { WithTimeStampBaseEntity } from '../../../models/repo';

export class SchoolEntity extends WithTimeStampBaseEntity {
	name: string;
}

export class SchoolShortEntity extends PickType(SchoolEntity, ['_id', 'name'] as const) {}
