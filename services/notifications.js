// services/notificationService.js
const { v4: uuidv4 } = require('uuid'); // Ensure you have uuid installed: npm install uuid
const db = require('../db/db.js'); // Adjust this path to your actual knex config file

// 🔔 Notify a specific user
async function notifyUser(userId, message) {
  await db('notifications').insert({
    id: uuidv4(),
    user_id: userId,
    message,
    status: 'Unread',
  });
}

// 👥 Notify multiple users
async function notifyUsers(userIds, message) {
  const notifications = userIds.map(userId => ({
    id: uuidv4(),
    user_id: userId,
    message,
    status: 'Unread',
  }));

  await db('notifications').insert(notifications);
}

async function notifyUsersByRole(role, message) {
  const users = await db("users").select("id").where({ role });
  const userIds = users.map((u) => u.id);

  if (userIds.length > 0) {
    await notifyUsers(userIds, message);
  }
}

// 🧑‍💼 Notify all supervisors
async function notifySupervisors(message) {
  const supervisors = await db('users')
    .select('id')
    .where('role', 'Supervisor'); // Assumes 'role' column in users table

  const supervisorIds = supervisors.map(s => s.id);

  if (supervisorIds.length > 0) {
    await notifyUsers(supervisorIds, message);
  }
}

module.exports = {
  notifyUser,
  notifyUsers,
  notifySupervisors,
  notifyUsersByRole
};
