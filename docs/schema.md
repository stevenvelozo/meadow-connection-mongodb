# Collections & Indexes

## Overview

MongoDB does not use SQL DDL statements. Instead, the connector creates **collections** (analogous to tables) and **indexes** from Meadow table schemas. The `generateCreateTableStatement()` method produces a descriptor object describing the collection and its indexes, and `createTable()` applies that descriptor to the connected database.

## Collection Creation

When `createTable(schema, callback)` is called:

1. A descriptor is generated from the schema via `generateCreateTableStatement()`
2. `db.createCollection(name)` creates the collection
3. `collection.createIndexes(indexes)` creates all indexes from the descriptor
4. If the collection already exists (error code 48 -- `NamespaceExists`), the error is handled gracefully and indexes are still created

## Index Mapping

Only certain Meadow data types produce indexes. All other types are stored without indexes.

| Meadow DataType | Index Created | Unique | Index Name Pattern |
|-----------------|---------------|--------|--------------------|
| `ID` | Ascending (`{ column: 1 }`) | Yes | `idx_{column}_unique` |
| `GUID` | Ascending (`{ column: 1 }`) | Yes | `idx_{column}_unique` |
| `ForeignKey` | Ascending (`{ column: 1 }`) | No | `idx_{column}` |
| `String` | None | -- | -- |
| `Numeric` | None | -- | -- |
| `Decimal` | None | -- | -- |
| `Text` | None | -- | -- |
| `DateTime` | None | -- | -- |
| `Boolean` | None | -- | -- |

### Index Rationale

- **ID** -- the primary auto-increment identifier; must be unique for direct lookups
- **GUID** -- the globally unique identifier; must be unique for cross-system references
- **ForeignKey** -- frequently used in queries and joins; indexed for fast lookups, but not unique since many documents can share the same foreign key value

## Schema Example

Given this Meadow table schema:

```javascript
let tmpAnimalSchema =
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

The generated descriptor:

```javascript
{
	operation: 'createCollection',
	collection: 'Animal',
	indexes:
	[
		{ key: { IDAnimal: 1 }, unique: true, name: 'idx_IDAnimal_unique' },
		{ key: { GUIDAnimal: 1 }, unique: true, name: 'idx_GUIDAnimal_unique' },
		{ key: { IDFarm: 1 }, name: 'idx_IDFarm' }
	]
}
```

Only three of the eight columns produce indexes. The remaining columns (`Name`, `Age`, `Weight`, `CreateDate`, `Deleted`) are stored in the document without dedicated indexes.

## Drop Descriptor

The `generateDropTableStatement(name)` method returns a minimal descriptor:

```javascript
let tmpDropDescriptor = _Fable.MeadowMongoDBProvider.generateDropTableStatement('Animal');
// => { operation: 'drop', collection: 'Animal' }
```

This descriptor is used by the Meadow provider layer to issue the actual `db.dropCollection()` call.

## Multiple Collections

Use `createTables()` to create multiple collections from a Stricture schema:

```javascript
let tmpSchema =
{
	Tables:
	[
		{
			TableName: 'Animal',
			Columns:
			[
				{ Column: 'IDAnimal', DataType: 'ID' },
				{ Column: 'GUIDAnimal', DataType: 'GUID' },
				{ Column: 'Name', DataType: 'String' }
			]
		},
		{
			TableName: 'Farm',
			Columns:
			[
				{ Column: 'IDFarm', DataType: 'ID' },
				{ Column: 'GUIDFarm', DataType: 'GUID' },
				{ Column: 'FarmName', DataType: 'String' }
			]
		}
	]
};

_Fable.MeadowMongoDBProvider.createTables(tmpSchema,
	(pError) =>
	{
		if (pError) { console.error(pError); return; }
		console.log('All collections and indexes created!');
	});
```

Collections are created sequentially (concurrency of 1) to ensure deterministic ordering.

## Comparison with SQL Connectors

| Feature | MongoDB Connector | SQL Connectors (MySQL, MSSQL, SQLite) |
|---------|-------------------|---------------------------------------|
| Output format | Descriptor object | SQL DDL string |
| Schema unit | Collection + Indexes | Table with columns |
| Column types | Not enforced (schema-less) | Enforced by database |
| Size constraints | Not applicable | `VARCHAR(N)`, `TEXT`, etc. |
| Primary key | Application-managed ID field | Inline `PRIMARY KEY` |
| Index creation | `collection.createIndexes()` | Inline or `CREATE INDEX` |
| Idempotent | Error code 48 handling | `IF NOT EXISTS` clause |
| Foreign keys | Application-level only | Database-enforced constraints |
| Drop | `{ operation: 'drop', collection }` | `DROP TABLE` string |

## Additional Indexes

The connector only creates indexes declared through the Meadow schema. For additional indexes (compound, text, geospatial, TTL), use the `pool` getter to access the `Db` instance and call MongoDB's native index API:

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

// Compound index
tmpCollection.createIndex({ IDFarm: 1, Name: 1 });

// Text index for full-text search
tmpCollection.createIndex({ Name: 'text' });

// TTL index for automatic document expiration
tmpCollection.createIndex({ CreateDate: 1 }, { expireAfterSeconds: 86400 });
```
