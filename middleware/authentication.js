const jwt = require('jsonwebtoken');
const db = require('../db/db.js'); // Make sure you export db using CommonJS
const dotenv = require('dotenv');

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY; 

// AUTHETICATION MIDDLEWARE
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user; 
        next(); 
    });
};

// ROLE PERMISSION
const authorizePermission = (...requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const userRole = req.user.role;

            console.log("User Role:", userRole);

            const roleData = await db('roles_permissions')
                .select('permissions')
                .where('role_name', userRole)
                .first();

            if (!roleData) {
                return res.status(403).json({ error: "Role not found" });
            }

            console.log("Raw Permissions from DB:", roleData.permissions);
            
            let permissions = roleData.permissions;
            if (typeof permissions === 'string') {
                 try {
                    permissions = JSON.parse(permissions);
                    } catch (jsonError) {
                        console.error("Error parsing permissions JSON:", jsonError);
                        return res.status(500).json({ error: "Invalid permissions format in database" });
                    }
                }


            console.log("Required Permissions:", requiredPermissions);
            console.log("User Has Permissions:", permissions);

            const hasPermission = requiredPermissions.some(permission => permissions.includes(permission));

            if (!hasPermission) {
                return res.status(403).json({ error: "Access denied. Only authorized personnel." });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

module.exports = {
    authenticateToken,
    authorizePermission
};