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

// Get patient records including medical history and prescriptions
router.get('/patients/:patientId/records', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.userId;
    
    // Check if the user is authorized to view this patient's records
    // If user is a patient, they can only view their own records
    // If user is a doctor, they need to have a completed appointment with this patient
    if (req.user.userType === 'patient') {
      // Get patient ID from the patients table for the current user
      const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
      if (patientData.length === 0) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      // Check if the requested patient ID matches the user's patient ID
      if (patientData[0].id.toString() !== patientId) {
        return res.status(403).json({ message: 'Access denied. Patients can only view their own records.' });
      }
    } else if (req.user.userType === 'doctor') {
      // Get doctor ID from the doctors table
      const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
      if (doctorData.length === 0) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      const doctorId = doctorData[0].id;
      
      // Check if the doctor has a completed appointment with this patient
      const [appointments] = await dbPool.query(`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE doctorId = ? AND patientId = ? AND status = 'completed'
      `, [doctorId, patientId]);
      
      const hasCompletedAppointment = appointments[0].count > 0;
      
      if (!hasCompletedAppointment) {
        return res.status(403).json({ 
          message: 'Access denied. You can only view records for patients with whom you have completed appointments',
          hasCompletedAppointment: false
        });
      }
    } else {
      return res.status(403).json({ message: 'Access denied. Invalid user type.' });
    }
    
    // Get basic patient information
    const [patientInfo] = await dbPool.query(`
      SELECT 
        p.id as patientId,
        CONCAT(u.firstName, ' ', u.lastName) as name,
        p.dateOfBirth,
        p.medicalHistory
      FROM patients p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
    `, [patientId]);
    
    if (patientInfo.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get prescriptions from medical records
    const [prescriptions] = await dbPool.query(`
      SELECT 
        mr.id,
        mr.diagnosis,
        mr.prescription,
        mr.notes,
        a.appointmentDate as date,
        CONCAT(u.firstName, ' ', u.lastName) as doctor
      FROM medicalrecord mr
      JOIN doctors d ON mr.doctorId = d.id
      JOIN users u ON d.userId = u.id
      LEFT JOIN appointments a ON mr.appointmentId = a.id
      WHERE mr.patientId = ? AND mr.prescription IS NOT NULL AND mr.prescription != ''
      ORDER BY a.appointmentDate DESC
    `, [patientId]);
    
    // Get visit records (completed appointments with diagnosis)
    const [visits] = await dbPool.query(`
      SELECT 
        a.id,
        a.appointmentDate as date,
        a.reason,
        mr.diagnosis,
        CONCAT(u.firstName, ' ', u.lastName) as doctor,
        mr.notes
      FROM appointments a
      JOIN doctors d ON a.doctorId = d.id
      JOIN users u ON d.userId = u.id
      LEFT JOIN medicalrecord mr ON a.id = mr.appointmentId
      WHERE a.patientId = ? AND a.status = 'completed'
      ORDER BY a.appointmentDate DESC
    `, [patientId]);
    
    // Format the patient info
    const patient = patientInfo[0];
    
    // Calculate age from date of birth
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const age = dob ? Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    // Parse medical history (stored in patients table)
    let medicalHistoryArray = [];
    if (patient.medicalHistory) {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(patient.medicalHistory);
        if (Array.isArray(parsed)) {
          medicalHistoryArray = parsed;
        } else if (typeof parsed === 'object') {
          // If it's an object, convert to array format expected by frontend
          medicalHistoryArray = [{
            condition: parsed.condition || 'Unknown condition',
            diagnosedDate: parsed.diagnosedDate || new Date().toISOString(),
            notes: parsed.notes || ''
          }];
        }
      } catch (e) {
        // If not JSON, treat as comma-separated string and create simple objects
        medicalHistoryArray = patient.medicalHistory.split(',').map(condition => ({
          condition: condition.trim(),
          diagnosedDate: new Date().toISOString(), // Default to current date
          notes: ''
        }));
      }
    }
    
    // Format prescriptions
    const medicationsArray = prescriptions.map(record => ({
      prescription: record.prescription,
      date: record.date ? new Date(record.date).toISOString() : null,
      doctor: record.doctor
    }));
    
    // Format visits
    const visitsArray = visits.map(visit => ({
      date: visit.date ? new Date(visit.date).toISOString() : null,
      reason: visit.reason || 'Consultation',
      diagnosis: visit.diagnosis || '',
      doctor: visit.doctor,
      notes: visit.notes || ''
    }));
    
    // Construct the response object
    const patientRecord = {
      patientId: patient.patientId.toString(),
      name: patient.name,
      age: age || 'Unknown',
      gender: patient.gender || 'Not specified',
      bloodType: patient.bloodType || 'Unknown',
      allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : [],
      medicalHistory: medicalHistoryArray,
      medications: medicationsArray,
      visits: visitsArray
    };
    
    res.json(patientRecord);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ message: 'Error fetching patient records' });
  }
});

module.exports = router;