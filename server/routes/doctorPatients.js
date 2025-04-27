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

// Get doctor's patients (patients with completed appointments with this doctor)
router.get('/doctor/patients', authenticateToken, async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can view their patients.' });
    }

    const userId = req.user.userId;

    // Get doctor ID from the doctors table
    const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
    if (doctorData.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const doctorId = doctorData[0].id;

    // Get patients who have completed appointments with this doctor
    const [patients] = await dbPool.query(`
      SELECT DISTINCT 
        p.id, 
        u.firstName, 
        u.lastName, 
        p.dateOfBirth,
        MAX(a.appointmentDate) as lastVisit,
        p.medicalHistory
      FROM patients p
      JOIN users u ON p.userId = u.id
      JOIN appointments a ON p.id = a.patientId
      WHERE a.doctorId = ? AND a.status = 'completed'
      GROUP BY p.id
      ORDER BY lastVisit DESC
    `, [doctorId]);

    // Format the response
    const formattedPatients = patients.map(patient => {
      // Calculate age from date of birth
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      const age = dob ? Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;
      
      // Extract conditions from medical history (assuming it's stored as a JSON string or comma-separated list)
      let conditions = [];
      if (patient.medicalHistory) {
        try {
          // Try parsing as JSON first
          conditions = JSON.parse(patient.medicalHistory);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          conditions = patient.medicalHistory.split(',').map(c => c.trim());
        }
      }
      
      // If conditions is still not an array or is empty, provide a default
      if (!Array.isArray(conditions) || conditions.length === 0) {
        conditions = ['No conditions recorded'];
      }

      return {
        id: patient.id.toString(),
        name: `${patient.firstName} ${patient.lastName}`,
        age: age || 'Unknown',
        gender: 'Not specified', // Add this field to the database or query if available
        lastVisit: patient.lastVisit ? new Date(patient.lastVisit).toISOString().split('T')[0] : null,
        conditions: conditions
      };
    });

    res.json(formattedPatients);
  } catch (error) {
    console.error('Error fetching doctor\'s patients:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// Check if a patient has completed appointments with the doctor
router.get('/doctor/check-patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.userId;

    // Verify user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can perform this check.' });
    }

    // Get doctor ID
    const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
    if (doctorData.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const doctorId = doctorData[0].id;

    // Check if patient exists and has completed appointments with this doctor
    const [appointments] = await dbPool.query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctorId = ? AND patientId = ? AND status = 'completed'
    `, [doctorId, patientId]);

    const hasCompletedAppointment = appointments[0].count > 0;

    res.json({ hasCompletedAppointment });
  } catch (error) {
    console.error('Error checking patient-doctor relationship:', error);
    res.status(500).json({ message: 'Error checking patient status' });
  }
});

// Get patients with completed appointments that are not in doctor's patient list
router.get('/doctor/potential-patients', authenticateToken, async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can view potential patients.' });
    }

    const userId = req.user.userId;

    // Get doctor ID
    const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
    if (doctorData.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const doctorId = doctorData[0].id;

    // Get patients with completed appointments
    const [patients] = await dbPool.query(`
      SELECT DISTINCT 
        p.id, 
        u.firstName, 
        u.lastName, 
        p.dateOfBirth,
        MAX(a.appointmentDate) as lastVisit
      FROM patients p
      JOIN users u ON p.userId = u.id
      JOIN appointments a ON p.id = a.patientId
      WHERE a.doctorId = ? AND a.status = 'completed'
      GROUP BY p.id
      ORDER BY lastVisit DESC
    `, [doctorId]);

    // Format the response
    const formattedPatients = patients.map(patient => {
      // Calculate age from date of birth
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      const age = dob ? Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;

      return {
        id: patient.id.toString(),
        name: `${patient.firstName} ${patient.lastName}`,
        age: age || 'Unknown',
        lastVisit: patient.lastVisit ? new Date(patient.lastVisit).toISOString().split('T')[0] : null
      };
    });

    res.json(formattedPatients);
  } catch (error) {
    console.error('Error fetching potential patients:', error);
    res.status(500).json({ message: 'Error fetching potential patients' });
  }
});

// Add medical record for a patient
router.post('/medicalrecords', authenticateToken, async (req, res) => {
  try {
    // Verify user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. Only doctors can add medical records.' });
    }

    const userId = req.user.userId;
    const { patientId, diagnosis, prescription, notes, appointmentId } = req.body;

    // Validate required fields
    if (!patientId || !diagnosis) {
      return res.status(400).json({ message: 'Patient ID and diagnosis are required' });
    }

    // Get doctor ID from the doctors table
    const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
    if (doctorData.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    const doctorId = doctorData[0].id;

    // Check if patient exists
    const [patientData] = await dbPool.query('SELECT id FROM patients WHERE id = ?', [patientId]);
    if (patientData.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if the doctor has a completed appointment with this patient
    const [appointments] = await dbPool.query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctorId = ? AND patientId = ? AND status = 'completed'
    `, [doctorId, patientId]);

    const hasCompletedAppointment = appointments[0].count > 0;

    if (!hasCompletedAppointment) {
      return res.status(403).json({ 
        message: 'You can only add medical records for patients with whom you have completed appointments',
        hasCompletedAppointment: false
      });
    }

    // If appointmentId is provided, verify it belongs to this doctor and patient
    if (appointmentId) {
      const [appointmentData] = await dbPool.query(`
        SELECT id FROM appointments 
        WHERE id = ? AND doctorId = ? AND patientId = ?
      `, [appointmentId, doctorId, patientId]);
      
      if (appointmentData.length === 0) {
        return res.status(404).json({ message: 'Appointment not found or does not belong to this doctor-patient relationship' });
      }
    }

    // Insert the medical record
    const [result] = await dbPool.query(`
      INSERT INTO medicalrecord (patientId, doctorId, appointmentId, diagnosis, prescription, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [patientId, doctorId, appointmentId || null, diagnosis, prescription || null, notes || null]);

    res.status(201).json({ 
      message: 'Medical record added successfully',
      recordId: result.insertId
    });
  } catch (error) {
    console.error('Error adding medical record:', error);
    res.status(500).json({ message: 'Error adding medical record' });
  }
});

module.exports = router;