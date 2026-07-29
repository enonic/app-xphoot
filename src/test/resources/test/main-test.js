var t = require('/lib/xp/testing');

var calls = {
    projectGet: 0,
    projectCreate: 0,
    importNodes: 0,
    publish: 0,
    createdId: null
};

t.mock('/lib/xp/cluster.js', {
    isLeader: function () {
        return true;
    }
});

t.mock('/lib/xp/context.js', {
    run: function (params, callback) {
        return callback();
    },
    get: function () {
        return {
            authInfo: {
                user: {
                    key: 'user:system:su'
                }
            }
        };
    }
});

t.mock('/lib/xp/project.js', {
    get: function () {
        calls.projectGet++;
        return null;
    },
    create: function (params) {
        calls.projectCreate++;
        calls.createdId = params.id;
        return {
            id: params.id
        };
    }
});

t.mock('/lib/xp/export.js', {
    importNodes: function () {
        calls.importNodes++;
        return {
            importErrors: []
        };
    }
});

t.mock('/lib/xp/content.js', {
    publish: function () {
        calls.publish++;
        return {
            failedContents: [],
            pushedContents: ['/xphoot']
        };
    }
});

require('/main.js');

exports.testInitImportsContentWhenProjectMissing = function () {
    t.assertEquals(1, calls.projectGet, 'getProject should be called once');
    t.assertEquals(1, calls.projectCreate, 'createProject should be called once');
    t.assertEquals('xphoot', calls.createdId, 'created project id');
    t.assertEquals(1, calls.importNodes, 'content should be imported synchronously');
    t.assertEquals(1, calls.publish, 'root content should be published synchronously');
};
