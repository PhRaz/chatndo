var AWS = require("aws-sdk");

AWS.config.update({
    region: "eu-west-3"
});

var dynamodb = new AWS.DynamoDB();

var tablesConfig = [
    {
        TableName: "userPage",
        KeySchema: [
            {
                AttributeName: "userId",
                KeyType: "HASH"
            },
            {
                AttributeName: "pageId",
                KeyType: "RANGE"
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "userId",
                AttributeType: "S"
            },
            {
                AttributeName: "pageId",
                AttributeType: "S"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        },
        GlobalSecondaryIndexes: [
            {
                IndexName: 'pageUser',
                KeySchema: [
                    {
                        AttributeName: 'pageId',
                        KeyType: "HASH"
                    },
                    {
                        AttributeName: 'userId',
                        KeyType: "RANGE"
                    }
                ],
                Projection: {
                    ProjectionType: "KEYS_ONLY"
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
                    WriteCapacityUnits: 10
                }
            }
        ]
    },
    {
        TableName: "pageList",
        KeySchema: [
            {AttributeName: "pageId", KeyType: "HASH"},
            {AttributeName: "itemId", KeyType: "RANGE"}
        ],
        AttributeDefinitions: [
            {AttributeName: "pageId", AttributeType: "S"},
            {AttributeName: "itemId", AttributeType: "S"}
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    },
    {
        TableName: "pageChat",
        KeySchema: [
            {AttributeName: "pageId", KeyType: "HASH"},
            {AttributeName: "itemId", KeyType: "RANGE"}
        ],
        AttributeDefinitions: [
            {AttributeName: "pageId", AttributeType: "S"},
            {AttributeName: "itemId", AttributeType: "S"}
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
        }
    }
];

var dynamoError = function (err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
};


tablesConfig.forEach(function(tableDefinition) {
    dynamodb.createTable(tableDefinition, dynamoError)
});
