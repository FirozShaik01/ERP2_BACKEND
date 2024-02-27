// const createError = require('http-errors')
const { SQL_ERROR, PROJECT_CREATION_ERROR } = require('../utils/Constants/response_messages')
const { Sequelize } = require('sequelize')
const ProjectsModel = require('../utils/Models/Projects/ProjectsModel');
// const ApartmentsModel = require('../utils/Models/ApartmentProjects/ApartmentProjectsModel');
// const VillasModel = require('../utils/Models/VillaProjects/VillaProjectsModel');
// const PlotsModel = require('../utils/Models/PlotProjects/PlotProjectsModel');
// const FarmLandsModel = require('../utils/Models/FarmLandProjects/FarmLandProjectsModel');

class ProjectsService {
    constructor() {

    }

    async createNewProject(payload) {
        try {
            // const models = {
            //     'APARTMENT': ApartmentsModel,
            //     'VILLA': VillasModel,
            //     'PLOT': PlotsModel,
            //     'FARM_LAND': FarmLandsModel,
            // };

            // const projectTypeModel = models[payload.project_type];
            // if (!projectTypeModel) {
            //     throw createError.BadRequest("Provide Correct Project Type");
            // }

            let payloadIdentifierCheck = payload.project_type + '_' + payload.project_name;
            if (payload.project_type === 'APARTMENT') {
                payloadIdentifierCheck += '_' + payload.tower_number + '_' + payload.flat_number;
            } else if (payload.project_type === 'VILLA') {
                payloadIdentifierCheck += '_' + payload.villa_number;
            } else if (payload.project_type === 'PLOT') {
                payloadIdentifierCheck += '_' + payload.plot_number;
            } else if (payload.project_type === 'FARM_LAND') {
                payloadIdentifierCheck += '_' + payload.plot_number + '_' + payload.sq_yards;
            }

            let data = await ProjectsModel.findOne({
                where: {
                    pid: payloadIdentifierCheck
                }
            });

            if (data) {
                throw new global.DATA.PLUGINS.httperrors.Conflict("Project already created with the given details");
            }

            let toBeCreatedProject = { ...payload, pid: payloadIdentifierCheck };
            console.log('toBeCreatedProject:', toBeCreatedProject);

            const newlyCreatedProject = await ProjectsModel.create(toBeCreatedProject);
            return newlyCreatedProject;

        } catch (err) {
            console.error("Error in createNewProject: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async editProject(payload) {
        try {
            let currentProjectId = payload.project_id;
            let currentPid = payload.pid;
            let payloadIdentifierCheck;
            let checkProjectName = (payload.project_name).split('').join('');
            let checkProjectType = (payload.project_type).split('').join('');
            if (checkProjectType === 'Apartment') {
                let checkProjectTowerNumber = (payload.tower_number).split('').join('');
                let checkProjectFlatNumber = (payload.flat_number).split('').join('');
                payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectTowerNumber + '_' + checkProjectFlatNumber;
            }
            else if (checkProjectType === 'Villa') {
                let checkProjectVillaNumber = (payload.villa_number).split('').join('');
                payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectVillaNumber;
            }
            else if (checkProjectType === 'Plot') {
                let checkProjectPlotNumber = (payload.plot_number).split('').join('');
                payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectPlotNumber;
            }
            else {
                throw createError.BadRequest("Provide Correct Project Type");
            }
            if (currentPid !== payloadIdentifierCheck) {

                console.log('payloadidentifier in edit:', payloadIdentifierCheck);
                // Check in Projects table whether pid is present or not
                const finder = await ProjectsModel.findOne({
                    where: {
                        pid: payloadIdentifierCheck
                    }
                }).catch(err => {
                    console.log("Error", err.message)
                    throw createError.InternalServerError(SQL_ERROR)
                })

                //Project Already Present
                if (finder) {
                    throw createError.Conflict("Project already created with the given details, Change it");
                }
            }

            console.log('edit doesn not exist:', payloadIdentifierCheck);
            let UpdateQuery;
            if (payload.project_type === 'Apartment') {
                UpdateQuery = `update projects set project_name='${payload.project_name}', tower_number='${payload.tower_number}' , flat_number='${payload.flat_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
            }
            else if (payload.project_type === 'Villa') {
                UpdateQuery = `update projects set project_name='${payload.project_name}' , villa_number='${payload.villa_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
            }
            else if (payload.project_type === 'Plot') {
                UpdateQuery = `update projects set project_name='${payload.project_name}' , plot_number='${payload.plot_number}' , status='${payload.status}' , pid='${payloadIdentifierCheck}' where project_id=${currentProjectId}`
            }
            console.log('edit update query:', UpdateQuery);
            const response = await DATA.CONNECTION.mysql.query(UpdateQuery, {
                type: Sequelize.QueryTypes.UPDATE
            }).catch(err => {
                console.log("Error while updating data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            //send data as response
            const updatedData = await ProjectsModel.findOne({
                where: {
                    project_id: currentProjectId
                }
            }).catch(err => {
                console.log("Error", err.message)
                throw createError.InternalServerError(SQL_ERROR)
            })

            return updatedData;


        } catch (err) {
            throw err;
        }
    }

    async changeProjectStatus(payload) {
        try {
            await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                let payloadIdentifierCheck;
                let checkProjectName = (payload.project_name).split('').join('');
                let checkProjectType = (payload.project_type).split('').join('');
                if (checkProjectType === 'Apartment') {
                    let checkProjectTowerNumber = (payload.tower_number).split('').join('');
                    let checkProjectFlatNumber = (payload.flat_number).split('').join('');
                    payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectTowerNumber + '_' + checkProjectFlatNumber;
                }
                else if (checkProjectType === 'Villa') {
                    let checkProjectVillaNumber = (payload.villa_number).split('').join('');
                    payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectVillaNumber;
                }
                else if (checkProjectType === 'Plot') {
                    let checkProjectPlotNumber = (payload.plot_number).split('').join('');
                    payloadIdentifierCheck = checkProjectName + '_' + checkProjectType + '_' + checkProjectPlotNumber;
                }

                const getProjectData = await global.DATA.MODELS.projects.findOne({
                    where: {
                        pid: payloadIdentifierCheck
                    },
                    transaction: t
                }).catch(err => {
                    throw createError.InternalServerError(SQL_ERROR);
                })
                console.log('sd:', getProjectData);
                console.log('sd check:', (getProjectData == null));
                payload.pid = payloadIdentifierCheck;
                payload.project_id = getProjectData?.project_id;
                console.log('payload:', payload);

                if ((getProjectData == null)) throw createError.BadRequest("Project Does not exists")
                console.log("Reached HEre")

                //check project exist in projects table or not 
                const checkProjectExistAlreadyInProject = await global.DATA.MODELS.projects.findOne({
                    where: {
                        project_id: payload.project_id
                    },
                    transaction: t
                }).catch(err => {
                    console.log(err);
                    throw createError.InternalServerError(SQL_ERROR);
                })

                //Update status and amount in projects table
                await global.DATA.MODELS.projects.update({
                    status: payload.status,
                    amount_received: parseInt(checkProjectExistAlreadyInProject.amount_received) + parseInt(payload.amount_received)
                }, {
                    where: {
                        project_id: payload.project_id,
                    },
                    transaction: t
                }).catch(err => {
                    console.log(err);
                    throw createError.InternalServerError(SQL_ERROR);
                })

                //check project exist in income table or not 
                const checkProjectExistAlreadyInIncome = await global.DATA.MODELS.income.findOne({
                    where: {
                        project_id: payload.project_id
                    },
                    transaction: t
                }).catch(err => {
                    throw createError.InternalServerError(SQL_ERROR);
                })

                console.log("checkProjectExistAlreadyInIncome:", checkProjectExistAlreadyInIncome)

                if (checkProjectExistAlreadyInIncome) {
                    console.log("project already exists in income table");
                    //then update details with amount added 

                    let previouslyReceivedAmount = checkProjectExistAlreadyInIncome.amount_received;
                    console.log('previously received amount:', previouslyReceivedAmount);


                    let updateIncomeDetails = {
                        status: payload.status,
                        amount_received: parseInt(previouslyReceivedAmount) + parseInt(payload.amount_received),
                    }

                    await global.DATA.MODELS.income.update(updateIncomeDetails, {
                        where: {
                            project_id: payload.project_id
                        },
                        transaction: t
                    })
                }
                else {
                    throw createError.BadRequest("First Onboard the Client and then change the project status")
                }

            })
            return "Project Status Changed Successfully"


        } catch (err) {
            throw err;
        }
    }

    async getProjectNames() {
        try {
            console.log('enter')
            const response = await DATA.CONNECTION.mysql.query(`select project_name from projects`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View All Projects", data);
            let uniqueProjectNames = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectNameData = data.filter(item => {
                if (!uniqueProjectNames.has(item.project_name.split('').join(''))) {
                    uniqueProjectNames.add(item.project_name.split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectNameData);
            return uniqueProjectNameData;
        }
        catch (err) {
            throw err;
        }
    }

    async getAvailableProjectNames() {
        try {
            const response = await DATA.CONNECTION.mysql.query(`select project_name from projects where status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View All Projects", data);
            let uniqueProjectNames = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectNameData = data.filter(item => {
                if (!uniqueProjectNames.has(item.project_name.split('').join(''))) {
                    uniqueProjectNames.add(item.project_name.split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectNameData);
            return uniqueProjectNameData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectTypes(payload) {
        try {
            const response = await DATA.CONNECTION.mysql.query(`select project_type from projects where project_name='${payload.project_name}'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Types", data);
            let uniqueProjectTypes = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectTypeData = data.filter(item => {
                if (!uniqueProjectTypes.has((item.project_type).split('').join(''))) {
                    uniqueProjectTypes.add((item.project_type).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectTypeData);
            return uniqueProjectTypeData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectTowerNumbers(payload) {
        try {
            if (payload.project_type !== 'Apartment') {
                throw createError.BadGateway("Tower Numbers will be for Apartment Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select tower_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Tower Numbers", data);
            let uniqueProjectTowerNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectTowerData = data.filter(item => {
                if (!uniqueProjectTowerNumbers.has((item.tower_number).split('').join(''))) {
                    uniqueProjectTowerNumbers.add((item.tower_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectTowerData);
            return uniqueProjectTowerData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectFlatNumbers(payload) {
        try {
            if (payload.project_type !== 'Apartment') {
                throw createError.BadGateway("Tower and Flat Numbers will be for Apartment Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select flat_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and tower_number='${payload.tower_number}'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Flat Numbers", data);
            let uniqueProjectFlatNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectFlatsData = data.filter(item => {
                if (!uniqueProjectFlatNumbers.has((item.flat_number).split('').join(''))) {
                    uniqueProjectFlatNumbers.add((item.flat_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectFlatsData);
            return uniqueProjectFlatsData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectVillaNumbers(payload) {
        try {
            if (payload.project_type !== 'Villa') {
                throw createError.BadGateway("Villa Numbers will be for Villa Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select villa_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project villa Numbers", data);
            let uniqueProjectVillaNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectVillaData = data.filter(item => {
                if (!uniqueProjectVillaNumbers.has((item.villa_number).split('').join(''))) {
                    uniqueProjectVillaNumbers.add((item.villa_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectVillaData);
            return uniqueProjectVillaData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectPlotNumbers(payload) {
        try {
            if (payload.project_type !== 'Plot') {
                throw createError.BadGateway("Plot Numbers will be for Plot Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select plot_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Plot Numbers", data);
            let uniqueProjectPlotNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectPlotsData = data.filter(item => {
                if (!uniqueProjectPlotNumbers.has((item.plot_number).split('').join(''))) {
                    uniqueProjectPlotNumbers.add((item.plot_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectPlotsData);
            return uniqueProjectPlotsData;
        }
        catch (err) {
            throw err;
        }
    }

    //available apis
    async getAvailableFilteredProjectTypes(payload) {
        try {
            let que = `select project_type from projects where project_name='${payload.project_name}' and status='AVAILABLE'`;
            console.log('available project type query check:', que);
            const response = await DATA.CONNECTION.mysql.query(`select project_type from projects where project_name='${payload.project_name}' and status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Types", data);
            let uniqueProjectTypes = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectTypeData = data.filter(item => {
                if (!uniqueProjectTypes.has((item.project_type).split('').join(''))) {
                    uniqueProjectTypes.add((item.project_type).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectTypeData);
            return uniqueProjectTypeData;
        }
        catch (err) {
            throw err;
        }
    }

    async getAvailableFilteredProjectTowerNumbers(payload) {
        try {
            if (payload.project_type !== 'Apartment') {
                throw createError.BadGateway("Tower Numbers will be for Apartment Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select tower_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Tower Numbers", data);
            let uniqueProjectTowerNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectTowerData = data.filter(item => {
                if (!uniqueProjectTowerNumbers.has((item.tower_number).split('').join(''))) {
                    uniqueProjectTowerNumbers.add((item.tower_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectTowerData);
            return uniqueProjectTowerData;
        }
        catch (err) {
            throw err;
        }
    }

    async getAvailableFilteredProjectFlatNumbers(payload) {
        try {
            if (payload.project_type !== 'Apartment') {
                throw createError.BadGateway("Tower and Flat Numbers will be for Apartment Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select flat_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and tower_number='${payload.tower_number}' and status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Flat Numbers", data);
            let uniqueProjectFlatNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectFlatsData = data.filter(item => {
                if (!uniqueProjectFlatNumbers.has((item.flat_number).split('').join(''))) {
                    uniqueProjectFlatNumbers.add((item.flat_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectFlatsData);
            return uniqueProjectFlatsData;
        }
        catch (err) {
            throw err;
        }
    }

    async getAvailableFilteredProjectVillaNumbers(payload) {
        try {
            if (payload.project_type !== 'Villa') {
                throw createError.BadGateway("Villa Numbers will be for Villa Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select villa_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project villa Numbers", data);
            let uniqueProjectVillaNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectVillaData = data.filter(item => {
                if (!uniqueProjectVillaNumbers.has((item.villa_number).split('').join(''))) {
                    uniqueProjectVillaNumbers.add((item.villa_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectVillaData);
            return uniqueProjectVillaData;
        }
        catch (err) {
            throw err;
        }
    }

    async getAvailableFilteredProjectPlotNumbers(payload) {
        try {
            if (payload.project_type !== 'Plot') {
                throw createError.BadGateway("Plot Numbers will be for Plot Project Types")
            }
            const response = await DATA.CONNECTION.mysql.query(`select plot_number from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and status='AVAILABLE'`, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw createError.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Plot Numbers", data);
            let uniqueProjectPlotNumbers = new Set();

            // Filter the data array to get only unique project_name values
            let uniqueProjectPlotsData = data.filter(item => {
                if (!uniqueProjectPlotNumbers.has((item.plot_number).split('').join(''))) {
                    uniqueProjectPlotNumbers.add((item.plot_number).split('').join(''));
                    return true;
                }
                return false;
            });

            console.log(uniqueProjectPlotsData);
            return uniqueProjectPlotsData;
        }
        catch (err) {
            throw err;
        }
    }

    async getFilteredProjectStatus(payload) {
        try {
            let query = '';
            console.log('project_type:', payload.project_type);
            if (payload.project_type === 'Apartment') {
                query = `select status from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and tower_number='${payload.tower_number}' and flat_number='${payload.flat_number}'`
            }
            else if (payload.project_type === 'Villa') {
                query = `select status from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and villa_number='${payload.villa_number}'`
            }
            else if (payload.project_type === 'Plot') {
                query = `select status from projects where project_name='${payload.project_name}' and project_type='${payload.project_type}' and plot_number='${payload.plot_number}'`
            }
            else {
                throw new global.DATA.PLUGINS.httperrors.BadGateway("Provide Correct Project Type")
            }
            console.log(query);
            const response = await DATA.CONNECTION.mysql.query(query, {
                type: Sequelize.QueryTypes.SELECT
            }).catch(err => {
                console.log("Error while fetching data", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(SQL_ERROR);
            })

            const data = (response);
            console.log("View FIltered Project Status", data);

            return data;
        }
        catch (err) {
            throw err;
        }
    }

    async getProjectsData(projectType) {
        // const models = {
        //     "APARTMENT": ApartmentsModel,
        //     "VILLA": VillasModel,
        //     "PLOT": PlotsModel,
        //     "FARM_LAND": FarmLandsModel,
        // };

        // const model = models[projectType.toUpperCase()];

        // if (!model) {
        //     throw new Error('Invalid project type'); // Or use createError.BadRequest if you have http-errors
        // }

        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: projectType
                }
            });
            return response; // Directly return the response, no need for extra variable
        } catch (err) {
            console.error("Error in getProjectsData: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    async getAvailableProjectsData(projectType) {
        // const models = {
        //     "APARTMENT": ApartmentsModel,
        //     "VILLA": VillasModel,
        //     "PLOT": PlotsModel,
        //     "FARM_LAND": FarmLandsModel,
        // };

        // const model = models[projectType.toUpperCase()];

        // if (!model) {
        //     throw new Error('Invalid project type'); // Or use createError.BadRequest if you have http-errors
        // }

        try {
            const response = await ProjectsModel.findAll({
                where: {
                    project_type: projectType,
                    status: 'AVAILABLE' // This line filters the results to only include available projects
                }
            });
            return response; // Directly return the response, no need for extra variable
        } catch (err) {
            console.error("Error in getProjectsData: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }



    async getStatusCount(projectType) {
        try {
            // const models = {
            //     "APARTMENT": ApartmentsModel,
            //     "VILLA": VillasModel,
            //     "PLOT": PlotsModel,
            //     "FARM_LAND": FarmLandsModel,
            // };

            // const model = models[projectType.toUpperCase()];
            // if (!model) {
            //     throw new Error('Invalid project type');
            // }

            const statuses = ['AVAILABLE', 'TOKEN', 'ADVANCE', 'PART-PAYMENT', 'BLOCK', 'SOLD'];
            const counts = await Promise.all(statuses.map(async (status) => {
                const count = await ProjectsModel.count({
                    where: {
                        project_type: projectType,
                        status: status
                    }
                });
                return { status, count };
            }));

            // Construct the response object
            const response = counts.reduce((acc, { status, count }) => {
                acc[status] = count;
                return acc;
            }, {});

            return response;
        } catch (err) {
            console.error("Error in createNewProject: ", err.message);

            // If it's a known error, rethrow it for the router to handle
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            // Log and throw a generic server error for unknown errors
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

}

module.exports = ProjectsService;