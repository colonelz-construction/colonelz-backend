import registerModel from "../../../models/usersModels/register.model.js";
import { responseData } from "../../../utils/respounse.js";
import bcrypt from "bcrypt";
import loginModel from "../../../models/usersModels/login.model.js";
import roleModel from "../../../models/adminModels/role.model.js";
import { onlyAlphabetsValidation } from "../../../utils/validation.js";
import { infotransporter } from "../../../utils/function.js";


function generateStrongPassword() {
    const length = 6;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}




export const createUser = async (req, res) => {
    const id = req.body.id;
    const user_name = req.body.user_name;
    const email = req.body.email;
    const role = req.body.role;
    
    


    if (!id) {
        return responseData(res, "", 400, false, "Please provide id");
    } else if (!user_name) {
        return responseData(res, "", 400, false, "Please provide user name");
    } else {
        try {
            const user = await registerModel.findOne({ _id: id });
            if (!user) {
                return responseData(res, "", 404, false, "User not found");
            } else {
                if (user.role === 'ADMIN' || user.role ==='SUPERADMIN') {
                    if(user.role ==='ADMIN' && role ==='ADMIN')
                        {
                            return responseData(res, "", 400, false, "You are not allowed to create admin");
                        }
                    const check_email_or_user_name = await registerModel.find({ $or: [{ email: email }, { username: user_name }] });
                    if (check_email_or_user_name.length < 1) {


                        const password = generateStrongPassword();
                       
                     

                        bcrypt.hash(password, 10, async function (err, hash) {
                            if (err) {
                                return responseData(res, "", 400, false, "Something went wrong");
                            } else {
                                let preAccess
                                const check_role = await roleModel.findOne({role:role})
                                if(check_role)
                                {
                                    preAccess = check_role.access
                                    // if(access)
                                    // {
                                    //     for (const key in access) {
                                    //         if (preAccess[key]) {
                                    //             // Replace existing permissions with new permissions from access[key]
                                    //             preAccess[key] = access[key];
                                    //         } else {
                                    //             preAccess[key] = access[key];
                                    //         }
                                    //     }
                                    // }
                                   
                                }
                                // else{
                                //      preAccess = await RoleAccess(role, access);
                                // }
                                
                                
                               
                                const newUser = new registerModel({
                                    username: user_name,
                                    email: email,
                                    role: role,
                                    status: true,
                                    userProfile: "",
                                    organization: user.organization,
                                    password: hash,
                                    access:preAccess,
                                    data: {
                                        projectData: [],
                                        quotationData: [],
                                        notificationData: [],
                                        leadData: []
                                    }
                                    
                                });

                                const mailOptions = {
                                    from: process.env.INFO_USER_EMAIL,
                                    to: email,
                                    subject: "Login Credentials",
                                    html: `
                                    <!DOCTYPE html>
                                    <html lang="en">
                                    <head>
                                        <meta charset="UTF-8">
                                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    </head>
                                    <body style="font-family: Arial, sans-serif;">
                                        <h2>Login Credentials</h2>
                                        <p>Hello ${user_name},</p>
                                        <p>Your login credentials for our system are as follows:</p>
                                        <p><strong>Username:  </strong>${user_name}</p>
                                        <p><strong>Password:  </strong>${password}</p>
                                         <p><strong>Organisation Name:  </strong>${user.organization}</p>
                                        <p>Please click on the following link to login:</p>
                                        <p><a href=${process.env.LOGIN_URL}>Login</a></p>
                                        <p>Please use the above credentials to log in to our system.</p>
                                        <p>If you have any questions or need assistance, feel free to contact us.</p>
                                        <p>Best regards,<br>COLONELZ</p>
                                    </body>
                                    </html>
                                    `,
                                };

                                infotransporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                        responseData(res, "", 400, false, "Failed to send email");
                                    }
                                     else {
                                        newUser.save();
                                        responseData(
                                            res,
                                            "User Created And send credential successfully!",
                                            200,
                                            true,
                                            ""
                                        );
                                    }
                                });
                            }
                        });
                    } else {
                        responseData(res, "", 400, false, "User Already Exist");
                    }
                } else {
                    return responseData(res, "", 400, false, "You are not allowed to perform this action");
                }
            }
        } catch (err) {
            return responseData(res, "", 500, false, err.message);
        }
    }
};



export const getUser = async (req, res) => {
    try {
        const userId = req.query.id;

        if (!userId) {
            return responseData(res, "", 400, false, "User Id is required");
        }

        const check_user = await registerModel.findById(userId);

        if (!check_user) {
            return responseData(res, "", 400, false, "You are not allowed to perform this action");
        }

        const users = await registerModel.find({ status: true, organization: check_user.organization }).select('username role email _id');

        if (!users.length) {
            return responseData(res, "", 404, false, "No User Found");
        }

        const filteredUsers = users.map(user => ({
            username: user.username,
            role: user.role,
            email: user.email,
            UserId: user._id,
        }));

        return responseData(res, "All users found", 200, true, "", filteredUsers);

    } catch (err) {
        return responseData(res, "", 500, false, err.message);
    }
};


export const deleteUser = async (req, res) => {
    try {
        const user_id = req.query.userId;
        const id = req.query.id;
        
        if (!user_id) {
            return responseData(res, "", 400, false, "User Id is required");
        }
        else if(!id)
        {
            return responseData(res, "", 400, false, "Id is required");
        }
        else {
            if (id === user_id) {
                return responseData(res, "", 400, false, "You can not delete yourself");
            }

            const user = await registerModel.findOne({ _id: user_id, status: true })
            if (!user) {
                return responseData(res, "", 404, false, "User Not Found");
            }
            else {
                
                const deletedUser = await registerModel.findOneAndUpdate({ _id: user_id }, { status: false }, { new: true })
                await loginModel.deleteMany({ userID: user_id })
                return responseData(res, "User Deleted Successfully", 200, true, "");
            }
        }


    }
    catch (err) {
        return responseData(res, "", 500, false, err.message);
    }
}


export const archiveUser = async (req, res) => {
    try {
        // Fetch users with status: false and project only the necessary fields
        const users = await registerModel.find({ status: false }, 'username role email _id access organization').lean();

        if (users.length === 0) {
            return responseData(res, "", 404, false, "No User Found");
        }

        // Transform users data into the desired structure
        const filteredUsers = users.map(user => ({
            username: user.username,
            role: user.role,
            email: user.email,
            UserId: user._id,
            access: user.access
        }));

        return responseData(res, "User Found", 200, true, "", filteredUsers);
    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal Server Error");
    }
};


export const restoreUser = async(req,res) =>{
    try{
        const user_id = req.body.user_id;
        if(!user_id)
        {
            return responseData(res, "", 400, false, "User Id is required");
        }
        else{
            const user = await registerModel.findOne({ _id: user_id, status: false })
            if (!user) {
                return responseData(res, "", 404, false, "User Not Found");
            }
            else {
             await registerModel.findOneAndUpdate({ _id: user_id }, { status: true }, { new: true })
             return responseData(res, "User Restored Successfully", 200, true, "");
              
        }
    }
    }
    catch(err)
    {
        console.log(err)
        return responseData(res, "", 500, false, `${err}`);
    }
}

export const deleteUserArchive = async(req,res) =>{
    try{
        const user_id = req.body.user_id;
        if(!user_id)
        {
            return responseData(res, "", 400, false, "User Id is required");
        }
        else{
            const user = await registerModel.findOne({ _id: user_id, status: false })
            if (!user) {
                return responseData(res, "", 404, false, "User Not Found");
            }
            else {
             await registerModel.findOneAndDelete({ _id: user_id })
             return responseData(res, "User Deleted Successfully", 200, true, "");
             }
}
}
catch(err)
{
        console.log(err)
        return responseData(res, "", 500, false, `${err}`);   
}
}

export const updateUserRole = async(req,res) =>{
    try{
        const user_id = req.body.userId;
        const role = req.body.role;
        if (!user_id) {
            return responseData(res, "", 400, false, "User ID is required");
        }
        if (!role  || role.length <= 3) {
            return responseData(res, "", 400, false, "Role name is not valid");
        }

        const user = await registerModel.findById(user_id);
        if (!user) {
            return responseData(res, "", 404, false, "User Not Found");
        }

        const check_role = await roleModel.findOne({ role });
        if (!check_role) {
            return responseData(res, "", 404, false, "Role Not Found");
        }

        await registerModel.findByIdAndUpdate(user_id, {
            $set: {
                role:role,
                access: check_role.access
            }
        }, { new: true });

        return responseData(res, "User Updated Successfully", 200, true, "");
    } catch (err) {
        console.error(err);
        return responseData(res, "", 500, false, "Internal Server Error");
    }
};