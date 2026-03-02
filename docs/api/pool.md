# pool (getter)

Returns the MongoDB `Db` instance for database-level operations.

## Signature

```javascript
get pool()
```

## Return Value

| Type | Description |
|------|-------------|
| `Db` | The MongoDB database instance (after connecting) |
| `false` | Before connection |

## Primary Use

The `pool` getter is the main entry point for all MongoDB operations. The name `pool` provides API symmetry with SQL-based Meadow connectors (which return connection pools), even though the MongoDB driver manages its own internal connection pool within the `MongoClient`.

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
```

## Collection Access

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');
```

## Query Example

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

// Find all animals
tmpCollection.find({}).toArray()
	.then((pDocs) =>
	{
		console.log(pDocs);
	});
```

## Query with Filter

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

// Find animals older than 3
tmpCollection.find({ Age: { $gt: 3 } }).toArray()
	.then((pDocs) =>
	{
		console.log(pDocs);
	});
```

## Insert Example

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

tmpCollection.insertOne(
	{
		IDAnimal: 1,
		GUIDAnimal: '550e8400-e29b-41d4-a716-446655440000',
		Name: 'Luna',
		Age: 5,
		IDFarm: 42
	})
	.then((pResult) =>
	{
		console.log('Inserted:', pResult.insertedId);
	});
```

## Update Example

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

tmpCollection.updateOne(
	{ IDAnimal: 1 },
	{ $set: { Name: 'Luna Belle', Age: 6 } })
	.then((pResult) =>
	{
		console.log('Modified:', pResult.modifiedCount);
	});
```

## Aggregation Example

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
let tmpCollection = tmpDB.collection('Animal');

tmpCollection.aggregate([
	{ $match: { Deleted: { $ne: 1 } } },
	{ $group: { _id: '$IDFarm', count: { $sum: 1 } } }
]).toArray()
	.then((pResults) =>
	{
		console.log(pResults);
		// => [{ _id: 42, count: 3 }, { _id: 17, count: 1 }]
	});
```

## Common Db Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `db.collection(name)` | `Collection` | Get a collection handle |
| `db.createCollection(name)` | `Promise` | Create a new collection |
| `db.dropCollection(name)` | `Promise` | Drop a collection |
| `db.listCollections()` | `Cursor` | List all collections |
| `db.stats()` | `Promise` | Get database statistics |
| `db.admin()` | `Admin` | Access admin operations |

## Before Connection

Returns `false` before `connect()` or `connectAsync()` is called:

```javascript
let tmpDB = _Fable.MeadowMongoDBProvider.pool;
// tmpDB => false (not connected yet)
```

Always check `connected` before using `pool`:

```javascript
if (!_Fable.MeadowMongoDBProvider.connected)
{
	console.error('Not connected to MongoDB.');
	return;
}

let tmpDB = _Fable.MeadowMongoDBProvider.pool;
```

## Related

- [client](client.md) -- Access the raw MongoClient
- [connectAsync](connectAsync.md) -- Establish the connection
