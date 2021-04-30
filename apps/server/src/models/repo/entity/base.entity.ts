import { Types } from 'mongoose';
import { applyDecorators } from '@nestjs/common';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

/** decorator: convert mongo ObjectId to string */
// export function ObjectIdToString({ value }) {
// 	return value instanceof Types.ObjectId ? value.toHexString() : value?.toString();
// }

/** decorator: validation and openapi spec for mongo object id */
// export function ExposeMongoIdAsString() {
// 	return applyDecorators(
// 		Expose(),
// 		/** Convert mongo ids to string when serializing */
// 		Transform(ObjectIdToString, { toPlainOnly: true }),

// 		// /** set api property type as string with mongo id format */
// 		// ApiProperty({ type: String, format: '/^[a-f0-9]{24}$/gi' })
// 	);
// }

export abstract class BaseEntity {
	@Exclude()
	_id: Types.ObjectId;
	@Expose()
	get id() {
		return this._id instanceof Types.ObjectId ? this._id.toHexString() : this._id?.toString();
	}
	@Exclude()
	__v?: number;
}

export abstract class WithTimeStampBaseEntity extends BaseEntity {
	/** the documents creation date */
	@Expose()
	createdAt: Date;
	/** the documents update date which is optional */
	@Expose()
	updatedAt?: Date;
}
