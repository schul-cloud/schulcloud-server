import { Types } from 'mongoose';

export abstract class BaseEntity {
	_id: Types.ObjectId;
	__v?: number;
}

export abstract class WithTimeStampBaseEntity extends BaseEntity {
	/** the documents creation date */
	createdAt: Date;
	/** the documents update date which is optional */
	updatedAt?: Date;
}
