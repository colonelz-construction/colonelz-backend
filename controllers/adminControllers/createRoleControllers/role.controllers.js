import roleModel from "../../../models/adminModels/role.model.js";
import registerModel from "../../../models/usersModels/register.model.js";
import { responseData } from "../../../utils/respounse.js";



export const createRole = async (req, res) => {
    try {
        const role = req.body.role;
        const access = req.body.access;


        const isEmpty = (obj) => {
            return Object.entries(obj).length === 0;
        };

        if (!role) {
            responseData(res, "", 400, false, "Role is required")

        }
        else if (isEmpty(access)) {
            responseData(res, "", 400, false, "Access is required")

        }
        else {

            if (role === 'ADMIN'
                || role === 'Site Supervisor'
                || role === 'Jr.Interior Designer'
                || role === '3D Visualizer'
                || role === 'Jr. Executive HR & Marketing'
                || role === 'Executive Assistant'
                || role === 'Project Architect'
                || role === 'Senior Architect'

            ) {
                // console.log("Role already exists")
                responseData(res, "", 400, false, "This role is predefine")
            }
            else {
                const checkRole = await roleModel.findOne({ role });
                if (checkRole) {
                    responseData(res, "", 400, false, "Role already exists")

                }
                else {
                    const newRole = await roleModel.create({ role, access });
                    responseData(res, "Role created successfully", 200, true, "")
                }
            }

        }
    }
    catch (err) {
        responseData(res, "", 500, false, "Internal Server Error")
        console.log(err)
    }
}

export const getRole = async (req, res) => {
    try {
        // Use aggregation to join roles and users in a single query
        const rolesWithUsers = await roleModel.aggregate([
            {
                $lookup: {
                    from: 'users', // The name of your user collection
                    localField: 'role',
                    foreignField: 'role',
                    as: 'users'
                }
            },
            {
                $project: {
                    _id: 1,
                    role: 1,
                    createdAt: 1,
                    access: 1,
                    existUser: { $gt: [{ $size: '$users' }, 0] }
                }
            }
        ]);

        responseData(res, "Roles found successfully", 200, true, "", rolesWithUsers);
    } catch (err) {
        responseData(res, "", 500, false, "Internal Server Error");
        console.error(err);
    }
};




export const UpdateRole = async (req, res) => {
    try {
        const { role, access } = req.body;
        const { id } = req.query;

        if (!id) {
            return responseData(res, "", 400, false, "Role id is required");
        }

        if (!role) {
            return responseData(res, "", 400, false, "Role is required");
        }

        if (!access) {
            return responseData(res, "", 400, false, "Access is required");
        }

        const existingRole = await roleModel.findById(id);
        if (!existingRole) {
            return responseData(res, "", 404, false, "Role not found for this id");
        }

        const updatedRole = await roleModel.findByIdAndUpdate(id, { role, access }, { new: true });

        if (updatedRole) {
            const usersToUpdate = await registerModel.find({ role: existingRole.role });

            if (usersToUpdate.length > 0) {
                await Promise.all(usersToUpdate.map(user =>
                    registerModel.findByIdAndUpdate(user._id, {
                        $set: { access, role }
                    })
                ));
            }

            return responseData(res, "Role updated successfully", 200, true, "");
        }

    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal Server Error");
    }
};


export const DeleteRole = async (req, res) => {
    try {
        const id = req.query.id;

        if (!id) {
            return responseData(res, "", 400, false, "Role id is required");
        }

        const check_role = await roleModel.findById(id);
        if (!check_role) {
            return responseData(res, "", 404, false, "Role not found for this id");
        }
        const users = await registerModel.find({ role: check_role.role });
        if (users.length > 0) {
            return responseData(res, "", 400, false, "This role cannot be deleted as it is assigned to the user.");
        }

        await roleModel.findByIdAndDelete(id);
        responseData(res, `${check_role.role} role has been deleted`, 200, true, "");

    } catch (err) {
        console.error(err);
        responseData(res, "", 500, false, "Internal Server Error");
    }
};



export const roleWiseAccess = async (req, res) => {
    try {
        const access = await roleModel.find({}).lean(); // Use lean for better performance

        if (access.length < 1) {
            return responseData(res, "No role found", 200, true, "");
        }

        const transformedData = {};

        // Use a single loop with flatMap to structure the data efficiently
        access.forEach(user => {
            Object.entries(user.access).forEach(([resource, actions]) => {
                actions.forEach(action => {
                    if (!transformedData[resource]) {
                        transformedData[resource] = {};
                    }
                    // Use the shorthand for initializing arrays
                    transformedData[resource][action] = transformedData[resource][action] || [];
                    transformedData[resource][action].push(user.role);
                });
            });
        });

        responseData(res, "Roles found successfully", 200, true, "", transformedData);
    } catch (err) {
        console.error(err);
        responseData(res, "", 500, false, "Internal Server Error");
    }
};



export const roleName = async (req, res) => {
    try {
        // Use lean to get plain JavaScript objects and only fetch the 'role' field
        const roles = await roleModel.find({}, 'role').lean();

        if (!roles.length) {
            return responseData(res, "No role found", 200, true, "");
        }

        // Directly extract role names using map
        const response = roles.map(({ role }) => role);

        return responseData(res, "Roles found successfully", 200, true, "", response);
    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal Server Error");
    }
};



