const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { authenticateToken } = require('../middleware/auth');

// MySQL Connection Pool (imported from main config)
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'database-1.c1yuys0g6rjh.eu-north-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'X5teKxirVcL2hgr',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'rasth_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Get user profile data
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Get user data
    const [userData] = await dbPool.query('SELECT id, firstName, lastName, email, phone FROM users WHERE id = ?', [userId]);
    
    if (userData.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userData[0];
    let response = { user };

    // Get additional data based on user type
    if (userType === 'patient') {

      const [patientData] = await dbPool.query(
        'SELECT id, dateOfBirth, address, medicalHistory, gender, bloodType FROM patients WHERE userId = ?', 
        [userId]
      );
      
      if (patientData.length > 0) {
        response.patient = patientData[0];
      }
    } else if (userType === 'doctor') {
    
      const [doctorData] = await dbPool.query(
        'SELECT id, specialization, licenseNumber, hospital, experience, education, status, gender FROM doctors WHERE userId = ?', 
        [userId]
      );
      
      if (doctorData.length > 0) {
        response.doctor = doctorData[0];
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile data' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    const { 
      firstName, lastName, email, phone,
      // Common fields for both user types
      gender,
      // Patient specific fields
      dateOfBirth, address, medicalHistory, bloodType,
      // Doctor specific fields
      specialization, licenseNumber, hospital, experience, education
    } = req.body;

    // Start a transaction
    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user table
      await connection.query(
        'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
        [firstName, lastName, email, phone, userId]
      );

      // Update type-specific table
      if (userType === 'patient') {
        const [patientData] = await connection.query('SELECT id FROM patients WHERE userId = ?', [userId]);
        
        if (patientData.length > 0) {
          await connection.query(
            'UPDATE patients SET dateOfBirth = ?, address = ?, medicalHistory = ?, gender = ?, bloodType = ? WHERE userId = ?',
            [dateOfBirth, address, medicalHistory, gender, bloodType, userId]
          );
        }
      } else if (userType === 'doctor') {
        const [doctorData] = await connection.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
        
        if (doctorData.length > 0) {
          await connection.query(
            'UPDATE doctors SET specialization = ?, licenseNumber = ?, hospital = ?, experience = ?, education = ?, gender = ? WHERE userId = ?',
            [specialization, licenseNumber, hospital, experience, education, gender, userId]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile data' });
  }
});

module.exports = router;