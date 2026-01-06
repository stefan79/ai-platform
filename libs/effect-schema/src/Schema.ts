export type Schema<Type> = {
  readonly _tag: 'Schema';
  /**
   * Phantom type marker for inference.
   */
  readonly _type?: Type;
};

export type To<InputSchema extends Schema<unknown>> = InputSchema extends Schema<infer Type> ? Type : never;

const schema = <Type>(): Schema<Type> => ({ _tag: 'Schema' });

export const String: Schema<string> = schema<string>();
export const Number: Schema<number> = schema<number>();
export const Boolean: Schema<boolean> = schema<boolean>();
export const Unknown: Schema<unknown> = schema<unknown>();

export function Literal<Values extends ReadonlyArray<string | number | boolean>>(
  ...values: Values
): Schema<Values[number]> {
  void values;
  return schema<Values[number]>();
}

export function Struct<Fields extends Record<string, Schema<unknown>>>(
  _fields: Fields,
): Schema<{ readonly [Key in keyof Fields]: To<Fields[Key]> }> {
  return schema<{ readonly [Key in keyof Fields]: To<Fields[Key]> }>();
}

export function Array<ItemSchema extends Schema<unknown>>(_item: ItemSchema): Schema<ReadonlyArray<To<ItemSchema>>> {
  return schema<ReadonlyArray<To<ItemSchema>>>();
}

export function Record<ValueSchema extends Schema<unknown>>(_value: ValueSchema): Schema<Record<string, To<ValueSchema>>> {
  return schema<Record<string, To<ValueSchema>>>();
}

export function Union<Schemas extends ReadonlyArray<Schema<unknown>>>(..._schemas: Schemas): Schema<To<Schemas[number]>> {
  return schema<To<Schemas[number]>>();
}
