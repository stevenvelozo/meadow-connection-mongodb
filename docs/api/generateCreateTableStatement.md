# generateCreateTableStatement(pMeadowTableSchema)

Generates a collection and index descriptor from a Meadow table schema. Returns the descriptor without applying it to the database.

## Signature

```javascript
generateCreateTableStatement(pMeadowTableSchema)
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `pMeadowTableSchema` | `object` | Meadow table schema with `TableName` and `Columns` array |

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `operation` | `string` | Always `'createCollection'` |
| `collection` | `string` | The collection name from `TableName` |
| `indexes` | `array` | Array of index specifications |

## Schema Object Format

```javascript
let tmpSchema =
{
	TableName: 'Animal',
	Columns:
	[
		{ Column: 'IDAnimal', DataType: 'ID' },
		{ Column: 'GUIDAnimal', DataType: 'GUID' },
		{ Column: 'Name', DataType: 'String' },
		{ Column: 'Age', DataType: 'Numeric' },
		{ Column: 'Weight', DataType: 'Decimal' },
		{ Column: 'IDFarm', DataType: 'ForeignKey' },
		{ Column: 'CreateDate', DataType: 'DateTime' },
		{ Column: 'Deleted', DataType: 'Boolean' }
	]
};
```

## Basic Usage

```javascript
let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(tmpSchema);

console.log(tmpDescriptor.operation);   // => 'createCollection'
console.log(tmpDescriptor.collection);  // => 'Animal'
console.log(tmpDescriptor.indexes);
```

Output indexes:

```javascript
[
	{ key: { IDAnimal: 1 }, unique: true, name: 'idx_IDAnimal_unique' },
	{ key: { GUIDAnimal: 1 }, unique: true, name: 'idx_GUIDAnimal_unique' },
	{ key: { IDFarm: 1 }, name: 'idx_IDFarm' }
]
```

## Index Generation Rules

| Meadow DataType | Index Created | Unique | Name Pattern |
|-----------------|---------------|--------|--------------|
| `ID` | Ascending (`{ col: 1 }`) | Yes | `idx_{col}_unique` |
| `GUID` | Ascending (`{ col: 1 }`) | Yes | `idx_{col}_unique` |
| `ForeignKey` | Ascending (`{ col: 1 }`) | No | `idx_{col}` |
| All others | None | -- | -- |

## Inspecting Without Applying

Use this method to preview what `createTable()` would do without actually creating the collection:

```javascript
let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(tmpSchema);

console.log(`Would create collection: ${tmpDescriptor.collection}`);
console.log(`Would create ${tmpDescriptor.indexes.length} indexes:`);
tmpDescriptor.indexes.forEach(
	(pIndex) =>
	{
		let tmpUnique = pIndex.unique ? ' (unique)' : '';
		console.log(`  ${pIndex.name}${tmpUnique}`);
	});
```

## Minimal Schema

A schema with no indexed columns produces an empty indexes array:

```javascript
let tmpMinimalSchema =
{
	TableName: 'Log',
	Columns:
	[
		{ Column: 'Message', DataType: 'String' },
		{ Column: 'Level', DataType: 'String' }
	]
};

let tmpDescriptor = _Fable.MeadowMongoDBProvider.generateCreateTableStatement(tmpMinimalSchema);
console.log(tmpDescriptor.indexes);  // => []
```

## Differences from SQL DDL

| Feature | SQL Connectors | MongoDB |
|---------|---------------|---------|
| Output | SQL `CREATE TABLE` string | Descriptor object |
| Column types | Enforced by database | Schema-less documents |
| Size constraints | `VARCHAR(N)`, `TEXT` | Not applicable |
| Primary key | Inline declaration | Application-managed |
| Indexes | Inline or separate SQL | Separate `indexes` array |
| Idempotent | `IF NOT EXISTS` | Error code 48 handling |

## Related

- [createTable](createTable.md) -- Generate and apply the descriptor
- [createTables](createTables.md) -- Apply multiple schemas
- [generateDropTableStatement](generateDropTableStatement.md) -- Generate drop descriptor
- [Collections & Indexes](../schema.md) -- Full index mapping reference
