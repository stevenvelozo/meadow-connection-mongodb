# client (getter)

Returns the raw `MongoClient` instance for server-level operations.

## Signature

```javascript
get client()
```

## Return Value

| Type | Description |
|------|-------------|
| `MongoClient` | The MongoDB client instance (after connecting) |
| `false` | Before connection |

## Primary Use

The `client` getter exposes the underlying `MongoClient` from the official MongoDB driver. In most cases you should use the `pool` getter (which returns the `Db`) instead. The `client` is useful for:

- Accessing other databases on the same server
- Managing client sessions for transactions
- Watching change streams at the cluster level
- Closing the connection when shutting down
- Monitoring connection pool events

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;
```

## Comparison with pool

| Getter | Returns | Purpose |
|--------|---------|---------|
| `pool` | `Db` | Database-level operations (collections, queries, aggregations) |
| `client` | `MongoClient` | Server-level operations (sessions, other databases, shutdown) |

The `pool` getter returns the `Db` instance for the configured database. The `client` getter returns the `MongoClient` that wraps the connection pool and provides server-level access.

## Access Another Database

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;

// Access a different database on the same server
let tmpAnalyticsDB = tmpClient.db('analytics');
let tmpEvents = tmpAnalyticsDB.collection('events');
```

## Client Session (Transactions)

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;

let tmpSession = tmpClient.startSession();
tmpSession.startTransaction();

try
{
	let tmpDB = _Fable.MeadowMongoDBProvider.pool;
	let tmpAnimals = tmpDB.collection('Animal');

	await tmpAnimals.insertOne({ Name: 'Fido' }, { session: tmpSession });
	await tmpAnimals.updateOne(
		{ Name: 'Luna' },
		{ $set: { Age: 6 } },
		{ session: tmpSession });

	await tmpSession.commitTransaction();
}
catch (pError)
{
	await tmpSession.abortTransaction();
}
finally
{
	tmpSession.endSession();
}
```

## Close Connection

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;

tmpClient.close()
	.then(() =>
	{
		console.log('MongoDB connection closed.');
	});
```

## Before Connection

Returns `false` before connection:

```javascript
let tmpClient = _Fable.MeadowMongoDBProvider.client;
// tmpClient => false (not connected yet)
```

## Related

- [pool](pool.md) -- The Db instance (recommended for most use)
- [connectAsync](connectAsync.md) -- Establish the connection
