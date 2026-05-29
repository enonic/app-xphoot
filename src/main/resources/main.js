const contextLib = require('/lib/xp/context');
const contentLib = require('/lib/xp/content');
const clusterLib = require('/lib/xp/cluster');
const exportLib = require('/lib/xp/export');
const projectLib = require('/lib/xp/project');
const taskLib = require('/lib/xp/task');

const projectData = {
    id: 'xphoot',
    displayName: 'xpHoot',
    description: 'The xpHoot site',
    readAccess: {
        public: true
    }
}

const runInContext = function (callback) {
    let result;
    try {
        result = contextLib.run({
            user: {
                login: "su",
                idProvider: "system"
            },
            repository: 'com.enonic.cms.' + projectData.id,
            branch: 'draft'
        }, callback);
    } catch (e) {
        log.info('Error: ' + e.message);
    }

    return result;
}

const createProject = function () {
    return projectLib.create(projectData);
}

const getProject = function () {
    return projectLib.get({
        id: projectData.id
    });
}

const initialize = function () {
    runInContext(() => {
        const project = getProject();
        if (!project) {
            taskLib.executeFunction({
                description: 'Importing content',
                func: initProject
            });
        }
        else {
            log.debug(`Project ${project.id} exists, skipping import`);
        }
    });
};

const initProject = function () {
    runInContext(() => {
        const project = createProject();

        if (project) {
            log.info('Project "' + projectData.id + '" successfully created');
            createContent();
            publishRoot();
        } else {
            log.error('Project "' + projectData.id + '" creation failed');
        }
    });
};

function createContent() {
    let importNodes = exportLib.importNodes({
        source: resolve('/import'),
        targetNodePath: '/content',
        xslt: resolve('/import/replace_app.xsl'),
        xsltParams: {
            applicationId: app.name,
            projectName: projectData.id
        },
        versionAttributes: {
            'content.import': {
                user: contextLib.get().authInfo.user.key,
                optime: new Date().toISOString()
            },
            'vacuum.skip': {}
        },
        includeNodeIds: true
    });
    if (importNodes.importErrors.length > 0) {
        log.warning('Errors:');
        importNodes.importErrors.forEach(element => log.warning(element.message));
        log.info('-------------------');
    }
}

function publishRoot() {
    const result = contentLib.publish({
        keys: ['/xphoot'],
        sourceBranch: 'draft',
        targetBranch: 'master',
        includeChildren: true,
        includeDependencies: true,
    });
    if (!result || (result.failedContents && result.failedContents.length > 0)) {
        log.warning('Could not publish imported content. failed=' + JSON.stringify(result && result.failedContents));
    } else {
        log.info('Published ' + (result.pushedContents ? result.pushedContents.length : 0) + ' content items.');
    }
}

if (clusterLib.isLeader()) {
    initialize();
}
