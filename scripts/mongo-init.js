// MongoDB initialization script
// Runs once when the MongoDB container is first started

db = db.getSiblingDB('medivault');

// Create collections with validators
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'pinHash', 'userType'],
      properties: {
        userId:   { bsonType: 'string', description: 'MediVault user ID' },
        pinHash:  { bsonType: 'string', description: 'bcrypt PIN hash' },
        userType: { bsonType: 'string', enum: ['patient', 'doctor', 'admin', 'pharmacy'] }
      }
    }
  }
});

db.createCollection('otplogs');
db.createCollection('loginhistories');

// Indexes
db.users.createIndex({ userId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ mobile: 1 }, { sparse: true });
db.otplogs.createIndex({ sessionId: 1 }, { unique: true });
db.otplogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 1800 });
db.loginhistories.createIndex({ userId: 1, createdAt: -1 });

print('MediVault MongoDB initialized successfully');
