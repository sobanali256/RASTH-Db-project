const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const doctorPatientsRoutes = require('./routes/doctorPatients');
const patientRecordsRoutes = require('./routes/patientRecords');
const { default: react } = require('@vitejs/plugin-react-swc');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';

const app = express();

app.use(cors());
app.use(express.json());

// Use routes - Note: doctorPatients routes already include /doctor/patients path
// so we need to register them directly at /api
app.use('/api', doctorPatientsRoutes);
app.use('/api', patientRecordsRoutes);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// MySQL Connection Pool (Recommended over single connection for web apps)
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'database-1.c1yuys0g6rjh.eu-north-1.rds.amazonaws.com',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'X5teKxirVcL2hgr',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'rasth_db', // Specify database here
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // Use promise wrapper for async/await

// Function to initialize database and tables
async function initializeDatabase() {
  try {
    // Test connection (pool automatically handles connections)
    const connection = await dbPool.getConnection();
    console.log('Connected to MySQL server via pool');

    // Create users table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        userType ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed initial admin user
    const adminEmail = 'admin@example.com';
    const [existingAdmin] = await connection.query(
      'SELECT * FROM users WHERE userType = "admin"'
    );

    if (existingAdmin.length === 0) {
      const adminPassword = await bcrypt.hash('Admin@1234', 10);
      await connection.query(
        'INSERT INTO users (email, password, userType) VALUES (?, ?, ?)',
        [adminEmail, adminPassword, 'admin']
      );
      console.log('Admin user created');
    }
    connection.release(); // Release the connection once

    // Database creation is often handled outside the app (e.g., manually or via migration tools)
    // If you must create it here, ensure the initial connection doesn't specify a database
    // For this example, we assume 'rasth_db' exists or is created beforehand.

    console.log('Using rasth_db database');

    // Define table creation queries individually
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        userType ENUM('patient', 'doctor', 'admin') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createPatientsTable = `
      CREATE TABLE IF NOT EXISTS patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        dateOfBirth DATE,
        address TEXT,
        medicalHistory TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createDoctorsTable = `
      CREATE TABLE IF NOT EXISTS doctors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        specialization VARCHAR(255),
        licenseNumber VARCHAR(50),
        hospital VARCHAR(255),
        experience INT,
        education TEXT,
        status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createAppointmentsTable = `
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        doctorId INT NOT NULL,
        appointmentDate DATETIME NOT NULL,
        appointmentType VARCHAR(50),
        reason TEXT,
        insuranceInfo TEXT,
        status ENUM('scheduled', 'completed', 'cancelled', 'pending') DEFAULT 'pending',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE
      );
    `;

    const createRatingTable = `
      CREATE TABLE IF NOT EXISTS rating (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        doctorId INT NOT NULL,
        appointmentId INT,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        review TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE SET NULL
      );
    `;

    const createMedicalRecordTable = `
      CREATE TABLE IF NOT EXISTS medicalrecord (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        doctorId INT NOT NULL,
        appointmentId INT,
        diagnosis TEXT NOT NULL,
        prescription TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (appointmentId) REFERENCES appointments(id) ON DELETE SET NULL
      );
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        senderId INT NOT NULL,
        receiverId INT NOT NULL,
        content TEXT NOT NULL,
        isRead BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiverId) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    // Execute table creation queries sequentially
    await dbPool.query(createUsersTable);
    console.log('Users table created or already exists.');
    await dbPool.query(createPatientsTable);
    console.log('Patients table created or already exists.');
    await dbPool.query(createDoctorsTable);
    console.log('Doctors table created or already exists.');
    await dbPool.query(createAppointmentsTable);
    console.log('Appointments table created or already exists.');
    await dbPool.query(createRatingTable);
    console.log('Rating table created or already exists.');
    await dbPool.query(createMedicalRecordTable);
    console.log('MedicalRecord table created or already exists.');
    await dbPool.query(createMessagesTable);
    console.log('Messages table created or already exists.');

    console.log('Database tables checked/created successfully');

  } catch (err) {
    console.error('Error during database initialization:', err);
    process.exit(1); // Exit if database setup fails
  }
}

// Start the server after initializing the database
const PORT = process.env.PORT || 3002;

async function startServer() {
  try {
    await initializeDatabase(); // Try to initialize DB
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
    console.log('Starting server without database connection...');
    // Continue without database - endpoints will handle errors gracefully
  }
  
  // Try to start server with automatic port increment if default port is busy
  const startServerWithPortFallback = (port) => {
    app.listen(port)
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
          startServerWithPortFallback(port + 1);
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      })
      .on('listening', () => {
        console.log(`Server running on port ${port}`);
      });
  };
  
  startServerWithPortFallback(PORT);
}

// Get medical records for a specific patient
app.get('/api/doctors/:id/records', authenticateToken, async (req, res) => {
  const patientId = req.params.id;

  if (!patientId) {
    return res.status(400).json({ message: 'Patient ID is required' });
  }
  
  try {

    const [[patientInfo]] = await dbPool.query(`
      SELECT u.firstName, u.lastName, p.dateOfBirth, p.address, u.id as userId
      FROM patients p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
      LIMIT 1
    `, [patientId]);

    // Calculate age if dateOfBirth exists
    let age = null;
    if (patientInfo && patientInfo.dateOfBirth) {
      const dob = new Date(patientInfo.dateOfBirth);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const [records] = await dbPool.query(`
      SELECT 
        mr.id, 
        mr.patientId, 
        mr.doctorId, 
        mr.appointmentId, 
        mr.diagnosis, 
        mr.prescription, 
        mr.notes, 
        mr.createdAt,
        a.appointmentDate, -- Include appointment date
        a.reason,
        u_doc.firstName AS doctorFirstName, -- Include doctor's first name
        u_doc.lastName AS doctorLastName -- Include doctor's last name
      FROM medicalrecord mr
      LEFT JOIN appointments a ON mr.appointmentId = a.id -- Join appointments for date
      LEFT JOIN doctors d ON mr.doctorId = d.id -- Join doctors 
      LEFT JOIN users u_doc ON d.userId = u_doc.id -- Join users for doctor names
      WHERE mr.patientId = ?
      ORDER BY mr.createdAt DESC;
    `, [patientId]);
     
    if (records.length === 0) {
      // It's better to return an empty array than a 404 if the patient exists but has no records
      return res.json([]); 
    }

    // Format the response to include patient info and records
    const formattedRecords = records.map(record => ({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      notes: record.notes,
      reason: record.reason,
      createdAt: record.createdAt,
      appointmentDate: record.appointmentDate,
      doctorName: record.doctorFirstName ? `Dr. ${record.doctorFirstName} ${record.doctorLastName}` : 'N/A'
    }));

    // Compose patient details
    const patientDetails = {
      patientId: patientId,
      name: patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Unknown',
      age: age,
      gender: patientInfo && patientInfo.gender ? patientInfo.gender : '',
      bloodType: '', // Add if you have bloodType in schema
      allergies: [], // Add if you have allergies in schema
      medicalHistory: [], // Fill if you have medical history
      medications: formattedRecords.map(r => ({
        prescription: r.prescription,
        appointmentDate: r.appointmentDate
      })), // Fill if you have medications
      visits: formattedRecords.map(r => ({
        date: r.appointmentDate,
        diagnosis: r.diagnosis,
        doctor: r.doctorName,
        notes: r.notes,
        reason: r.reason
      }))
    };

    res.json(patientDetails);
  } catch (err) {
    console.error('Error fetching medical records:', err);
    res.status(500).json({ message: 'Server error fetching medical records' });
  }
});



//Api for patients to get records
app.get('/api/patients/records', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
   
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  try {

    const [patientRows] = await dbPool.query(`
      SELECT p.id
      FROM patients p
      WHERE p.userid =?
    `, [userId]);
  

    if (patientRows.length === 0) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [[patientInfo]] = await dbPool.query(`
      SELECT u.firstName, u.lastName, p.dateOfBirth, p.address, u.id as userId
      FROM patients p
      JOIN users u ON p.userId = u.id
      WHERE p.id = ?
      LIMIT 1
    `, [patientRows[0].id]);

    // Calculate age if dateOfBirth exists
    let age = null;
    if (patientInfo && patientInfo.dateOfBirth) {
      const dob = new Date(patientInfo.dateOfBirth);
      const diff = Date.now() - dob.getTime();
      const ageDate = new Date(diff);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const [records] = await dbPool.query(`
      SELECT 
        mr.id, 
        mr.patientId, 
        mr.doctorId, 
        mr.appointmentId, 
        mr.diagnosis, 
        mr.prescription, 
        mr.notes, 
        mr.createdAt,
        a.appointmentDate, -- Include appointment date
        a.reason,
        u_doc.firstName AS doctorFirstName, -- Include doctor's first name
        u_doc.lastName AS doctorLastName -- Include doctor's last name
      FROM medicalrecord mr
      LEFT JOIN appointments a ON mr.appointmentId = a.id -- Join appointments for date
      LEFT JOIN doctors d ON mr.doctorId = d.id -- Join doctors 
      LEFT JOIN users u_doc ON d.userId = u_doc.id -- Join users for doctor names
      WHERE mr.patientId = ?
      ORDER BY mr.createdAt DESC;
    `, [patientRows[0].id]);

    if (records.length === 0) {
      // It's better to return an empty array than a 404 if the patient exists but has no records
      return res.json([]); 
    }

    // Format the response to include patient info and records
    const formattedRecords = records.map(record => ({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      notes: record.notes,
      reason: record.reason,
      createdAt: record.createdAt,
      appointmentDate: record.appointmentDate,
      doctorName: record.doctorFirstName ? `Dr. ${record.doctorFirstName} ${record.doctorLastName}` : 'N/A'
    }));

    // Compose patient details
    const patientDetails = {
      patientId: patientRows[0].id,
      name: patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Unknown',
      age: age,
      gender: patientInfo && patientInfo.gender ? patientInfo.gender : '',
      bloodType: '', // Add if you have bloodType in schema
      allergies: [], // Add if you have allergies in schema
      medicalHistory: [], // Fill if you have medical history
      medications: formattedRecords.map(r => ({
        prescription: r.prescription,
        appointmentDate: r.appointmentDate
      })), // Fill if you have medications
      visits: formattedRecords.map(r => ({
        date: r.appointmentDate,
        diagnosis: r.diagnosis,
        doctor: r.doctorName,
        notes: r.notes,
        reason: r.reason
      }))
    };
    
    return res.json(patientDetails);
    
  } catch (error) {
    console.error('Error fetching patient records:', error);
    return res.status(500).json({ message: 'Error fetching patient records', error: error.message });
  }
});


// Get unrated completed appointments for the logged-in patient
app.get('/api/appointments/unrated', authenticateToken, async (req, res) => {
  const loggedInUserId = req.user.userId;
  if (!loggedInUserId) {
    return res.status(401).json({ message: 'User ID not found in token' });
  }

  try {
    const [appointments] = await dbPool.query(`
      SELECT
        a.id,
        a.doctorId,
        a.appointmentDate AS date,
        a.status,
        u_doc.firstName AS doctorFirstName,
        u_doc.lastName AS doctorLastName
      FROM appointments a
      JOIN doctors doc ON a.doctorId = doc.id
      JOIN users u_doc ON doc.userId = u_doc.id
      JOIN patients p ON a.patientId = p.id
      LEFT JOIN rating r ON a.id = r.appointmentId
      WHERE a.status = 'completed'
        AND p.userId = ?  -- Filter by the logged-in user's ID
        AND r.id IS NULL -- Ensure no rating exists for this appointment
      ORDER BY a.appointmentDate DESC;
    `, [loggedInUserId]);

    // Format the response to match the frontend's expected structure
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id.toString(),
      doctorId: apt.doctorId.toString(),
      doctorName: `Dr. ${apt.doctorFirstName} ${apt.doctorLastName}`,
      date: new Date(apt.date),
      status: apt.status,
      isRated: false // Explicitly set as false since we are fetching unrated ones
    }));

    res.json(formattedAppointments);
  } catch (err) {
    console.error('Error fetching unrated appointments:', err);
    res.status(500).json({ message: 'Server error fetching unrated appointments' });
  }
});

// Get unrated completed appointments
app.get('/api/appointments/unrated', authenticateToken, async (req, res) => {
  try {
    const [appointments] = await dbPool.query(`
      SELECT a.*, 
        d.firstName AS doctor_first_name, 
        d.lastName AS doctor_last_name
      FROM appointments a
      LEFT JOIN rating r ON a.id = r.appointmentId
      JOIN doctors d ON a.doctorId = d.id
      WHERE a.status = 'completed'
      AND r.appointmentId IS NULL
      AND a.patientId = ?
      ORDER BY a.appointmentDate DESC
    `, [req.user.userId]);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Fetch the appointment to check ownership and current status
    const [appointments] = await dbPool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const appointment = appointments[0];

    // If user is a patient and wants to cancel, check ownership and status
    if (req.user.userType === 'patient' && status === 'cancelled') {
      // Get patientId for this user
      const [patients] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [req.user.userId]);
      if (patients.length === 0) {
        return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
      }
      const patientId = patients[0].id;
      if (appointment.patientId !== patientId) {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
      if (!(appointment.status === 'pending' || appointment.status === 'scheduled')) {
        return res.status(400).json({ message: 'Only pending or scheduled appointments can be cancelled' });
      }
    }

    // Doctors/admins can still update status as before
    const [result] = await dbPool.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const [updatedAppointment] = await dbPool.query(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );

    res.json(updatedAppointment[0]);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Error updating appointment status' });
  }
});

startServer();

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, phone, userType, ...additionalInfo } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !userType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Use pool for connections
  let connection;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();

    // Check if user already exists
    const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      await connection.rollback();
      connection.release(); // Release connection before returning
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await connection.query(
      'INSERT INTO users (firstName, lastName, email, password, phone, userType) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, phone, userType]
    );

    const userId = result.insertId;

    // Insert additional info based on user type
    if (userType === 'patient') {
      // Set default values for optional fields
      const dateOfBirth = additionalInfo.dateOfBirth || null;
      const address = additionalInfo.address || '';
      const medicalHistory = additionalInfo.medicalHistory || '';

      await connection.query(
        'INSERT INTO patients (userId, dateOfBirth, address, medicalHistory) VALUES (?, ?, ?, ?)',
        [userId, dateOfBirth, address, medicalHistory]
      );
    } else if (userType === 'doctor') {
      // Set default values for optional fields
      const specialization = additionalInfo.specialization || '';
      const licenseNumber = additionalInfo.licenseNumber || '';
      const hospital = additionalInfo.hospital || '';
      // Ensure experience is a number, default to 0 if not provided or invalid
      const experience = Number.isInteger(parseInt(additionalInfo.experience)) ? parseInt(additionalInfo.experience) : 0;
      const education = additionalInfo.education || '';

      await connection.query(
        'INSERT INTO doctors (userId, specialization, licenseNumber, hospital, experience, education) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, specialization, licenseNumber, hospital, experience, education]
      );
    }

    // Commit the transaction
    await connection.commit();

    // Generate JWT token
    const token = jwt.sign({ userId, userType }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      userType,
      userId
    });
  } catch (error) {
    // Rollback transaction on error
    if (connection) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
    }
    // Log the detailed error for server-side debugging
    console.error('Detailed Registration Error:', error);
    console.error('Error Stack:', error.stack);
    console.error('Error Details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });

    // Send a more specific or generic error to the client based on the error code
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Email already in use' });
    } else if (error.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({ message: 'Invalid reference in data (e.g., non-existent user ID)' });
    } else if (error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({ message: 'Input data too long for a field' });
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
        // This often happens with incorrect ENUM values or data types (e.g., string for INT)
        console.error(`Potential incorrect data type or ENUM value for field: ${error.message}`);
        return res.status(400).json({ message: 'Invalid data provided for one or more fields.' });
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
        return res.status(400).json({ message: 'Required field cannot be null' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('Database access denied:', error);
        return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    }
    // Generic error for other cases with more context
    console.error('Unhandled registration error:', error);
    res.status(500).json({
      message: 'An error occurred during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    // Release the connection
    if (connection) connection.release();
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let connection;
  try {
    // Get a connection from the pool
    connection = await dbPool.getConnection();
    
    // Get user using the connection with better error handling
    const [users] = await connection.query(
      'SELECT users.*, doctors.status as doctorStatus FROM users LEFT JOIN doctors ON users.id = doctors.userId WHERE users.email = ?',
      [email]
    ).catch(err => {
      console.error('Database query error:', err);
      throw { code: err.code || 'DB_ERROR', message: 'Database connection error' };
    });

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check doctor status if applicable
    if (user.userType === 'doctor' && user.doctorStatus !== 'active') {
      return res.status(403).json({ message: 'Account pending approval' });
    }

    // Get user specific data for dashboard
    let userData = {};
    if (user.userType === 'patient') {
      try {
        const [patientData] = await connection.query('SELECT * FROM patients WHERE userId = ?', [user.id]);
        if (patientData.length > 0) {
          userData = patientData[0];
        }
      } catch (queryError) {
        console.error('Error fetching patient data:', queryError);
        // Continue with login even if we can't get additional data
        userData = { error: 'Could not retrieve complete profile data' };
      }
    } else if (user.userType === 'doctor') {
      try {
        const [doctorData] = await connection.query('SELECT * FROM doctors WHERE userId = ?', [user.id]);
        if (doctorData.length > 0) {
          userData = doctorData[0];
        }
      } catch (queryError) {
        console.error('Error fetching doctor data:', queryError);
        // Continue with login even if we can't get additional data
        userData = { error: 'Could not retrieve complete profile data' };
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      userType: user.userType,
      userId: user.id,
      userData: userData // Send combined user data
    });
  } catch (error) {
    console.error('Login error:', error);
    // Provide more specific error messages based on error type
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ message: 'Database authentication error. Please contact support.' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Database query error. Please contact support.' });
    } else if (error.code === 'DB_ERROR') {
      return res.status(500).json({ message: error.message || 'Database error. Please try again later.' });
    } else {
      return res.status(500).json({ message: 'An error occurred during login. Please try again.' });
    }
  } finally {
    // Release the connection back to the pool
    if (connection) connection.release();
  }
});

// Get user profile endpoint
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Get user data using the pool
    const [users] = await dbPool.query('SELECT id, firstName, lastName, email, phone, userType, createdAt FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = users[0];
    let profileData = {};

    // Get additional profile data based on user type using the pool
    if (userType === 'patient') {
      const [patientData] = await dbPool.query('SELECT * FROM patients WHERE userId = ?', [userId]);
      if (patientData.length > 0) {
        profileData = patientData[0];
      }
    } else if (userType === 'doctor') {
      const [doctorData] = await dbPool.query('SELECT * FROM doctors WHERE userId = ?', [userId]);
      if (doctorData.length > 0) {
        profileData = doctorData[0];
      }
    }

    res.json({
      user: userData,
      profile: profileData
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile endpoint
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    const { firstName, lastName, phone, ...additionalInfo } = req.body;

    // Use pool for update queries
    await dbPool.query(
      'UPDATE users SET firstName = ?, lastName = ?, phone = ? WHERE id = ?',
      [firstName, lastName, phone, userId]
    );

    // Update additional info based on user type
    if (userType === 'patient') {
      const { dateOfBirth, address, medicalHistory } = additionalInfo;
      await dbPool.query(
        'UPDATE patients SET dateOfBirth = ?, address = ?, medicalHistory = ? WHERE userId = ?',
        [dateOfBirth, address, medicalHistory, userId]
      );
    } else if (userType === 'doctor') {
      const { specialization, hospital, experience, education } = additionalInfo;
      await dbPool.query(
        'UPDATE doctors SET specialization = ?, hospital = ?, experience = ?, education = ? WHERE userId = ?',
        [specialization, hospital, experience, education, userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Admin endpoints
// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Get active doctors
app.get('/api/doctors/active', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await dbPool.getConnection();
    const [doctors] = await connection.query(
      `SELECT d.id as doctorId, d.specialization, d.hospital, d.experience,
              u.firstName, u.lastName, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.userId = u.id
       WHERE d.status = 'active' 
       ORDER BY u.firstName, u.lastName`,
      []
    );
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching active doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  } finally {
    if (connection) connection.release();
  }
});

// Book appointment
app.post('/api/appointmentBook', authenticateToken, async (req, res) => {
  try {
    const {
      userId, // Changed from patientId to userId
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      reason,
      notes,
      insuranceInfo
    } = req.body;

    // Only "reason" is required
    if (!reason) {
      return res.status(400).json({ message: 'Appointment reason is required' });
    }

    // Get patientId from patients table using userId
    const [patientResult] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
    
    if (patientResult.length === 0) {
      return res.status(404).json({ message: 'Patient record not found for this user' });
    }
    
    const patientId = patientResult[0].id;
    //console.log(`Found patientId: ${patientId} for userId: ${userId}`);

    // Handle optional fields
    const safeDoctorId = doctorId;
    const safeAppointmentType = appointmentType ?? null;
    const safeNotes = notes ?? null;
    const safeInsuranceInfo = insuranceInfo ?? null;
    
    // Validate and format appointment date and time
    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Appointment date and time are required' });
    }
    
    // Format the datetime string for MySQL
    // Convert time like "09:00 AM" to 24-hour format for MySQL
    let formattedTime = appointmentTime;
    if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
      const timeParts = appointmentTime.match(/([\d]+):([\d]+)\s*(AM|PM)/);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = timeParts[2];
        const period = timeParts[3];
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      }
    }
    
    const appointmentDateTime = `${appointmentDate} ${formattedTime}`;

    // Insert into appointments table
    const [result] = await dbPool.query(
      'INSERT INTO appointments (patientId, doctorId, appointmentDate, appointmentType, reason, notes, insuranceInfo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        patientId,
        safeDoctorId,
        appointmentDateTime,
        safeAppointmentType,
        reason,
        safeNotes,
        safeInsuranceInfo,
        'pending'
      ]
    );

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: {
        id: result.insertId,
        patientId,
        doctorId: safeDoctorId,
        appointmentDate,
        appointmentTime,
        appointmentType: safeAppointmentType,
        reason,
        notes: safeNotes,
        insuranceInfo: safeInsuranceInfo,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Error booking appointment' });
  }
});


// Get patient or doctor appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const userType = req.user.userType;
    const userId = req.user.userId;
    let appointments = [];

    if (userType === 'patient') {
      const [patientAppointments] = await dbPool.query(
        `SELECT a.id, a.appointmentDate, a.appointmentType, a.reason, a.notes, a.insuranceInfo, a.status, 
                u.firstName AS doctorFirstName, u.lastName AS doctorLastName, d.specialization
         FROM appointments a
         JOIN doctors d ON a.doctorId = d.id
         JOIN users u ON d.userId = u.id
         JOIN patients p ON a.patientId = p.id
         WHERE p.userId = ?
         ORDER BY a.appointmentDate DESC`,
        [userId]
      );

      appointments = patientAppointments.map(a => ({
        id: a.id,
        date: a.appointmentDate,
        time: a.appointmentDate
          ? new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        doctorName: `Dr. ${a.doctorFirstName} ${a.doctorLastName}`,
        specialization: a.specialization,
        reason: a.reason,
        notes: a.notes,
        insuranceInfo: a.insuranceInfo,
        status: a.status,
        type: a.appointmentType
      }));
    } 
    
    else if (userType === 'doctor') {
      const [doctorAppointments] = await dbPool.query(
        `SELECT a.id, a.appointmentDate, a.appointmentType, a.reason, a.notes, a.insuranceInfo, a.status, 
                u.firstName AS patientFirstName, u.lastName AS patientLastName
         FROM appointments a
         JOIN patients p ON a.patientId = p.id
         JOIN users u ON p.userId = u.id
         WHERE a.doctorId = (
           SELECT id FROM doctors WHERE userId = ?
         )
         ORDER BY a.appointmentDate DESC`,
        [userId]
      );

      appointments = doctorAppointments.map(a => ({
        id: a.id,
        date: a.appointmentDate,
        time: a.appointmentDate
          ? new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
        patientName: `${a.patientFirstName} ${a.patientLastName}`,
        reason: a.reason,
        notes: a.notes,
        insuranceInfo: a.insuranceInfo,
        status: a.status,
        type: a.appointmentType
      }));
    }

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});


// Get all users for admin
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  let connection;
  try {
    // Get a connection from the pool
    connection = await dbPool.getConnection();
    
    console.log('Executing admin users query...');
    
    const [users] = await connection.query(
      'SELECT id, firstName, lastName, email, phone, userType, createdAt FROM users'
    );
    
    console.log(`Found ${users.length} users`);
    
    // Return empty array if no users (instead of null/undefined)
    res.json(users || []);
  } catch (error) {
    // Detailed error logging
    console.error('Error fetching users:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Send appropriate error response
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      res.status(500).json({ message: 'Database connection timeout. Please try again later.' });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database table not found. Please check database setup.' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ message: 'Invalid database field. Please check query structure.' });
    } else {
      res.status(500).json({ message: 'Error fetching users' });
    }
  } finally {
    // Always release the connection back to the pool
    if (connection) connection.release();
  }
});

// Get consolidated admin statistics
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  let connection;
  try {
    connection = await dbPool.getConnection();

    // Get total patients
    const [patientResult] = await connection.query(
      'SELECT COUNT(*) as count FROM users WHERE userType = ?',
      ['patient']
    );
    const totalPatients = patientResult[0].count;

    // Get total active/inactive doctors (status != 'pending')
    const [activeDoctorResult] = await connection.query(
      'SELECT COUNT(*) as count FROM doctors WHERE status != ?',
      ['pending']
    );
    const activeDoctorCount = activeDoctorResult[0].count;

    // Get total pending doctors
    const [pendingDoctorResult] = await connection.query(
      'SELECT COUNT(*) as count FROM doctors WHERE status = ?',
      ['pending']
    );
    const pendingDoctorCount = pendingDoctorResult[0].count;

    // Get total appointments for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [appointmentsTodayResult] = await connection.query(
      'SELECT COUNT(*) as count FROM appointments WHERE appointmentDate >= ? AND appointmentDate <= ?',
      [todayStart, todayEnd]
    );
    const appointmentsToday = appointmentsTodayResult[0].count;

    res.json({
      totalPatients,
      activeDoctorCount,
      pendingDoctorCount,
      appointmentsToday
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  } finally {
    if (connection) connection.release();
  }
});

// Get all pending doctor applications for admin
app.get('/api/admin/pending-doctors', authenticateToken, isAdmin, async (req, res) => {
  let connection;
  try {
    // Get a connection from the pool
    connection = await dbPool.getConnection();
    
    console.log('Executing pending doctors query...');
    
    // Use parameterized query for better security and performance
    const [pendingDoctors] = await connection.query(
      `SELECT d.id as doctorId, u.id as userId, u.firstName, u.lastName, u.email, u.phone, 
       d.specialization, d.licenseNumber, d.hospital, d.experience, d.education, u.createdAt 
       FROM doctors d 
       JOIN users u ON d.userId = u.id 
       WHERE d.status = 'pending'`
    );
    
    console.log(`Found ${pendingDoctors.length} pending doctor applications`);
    
    // Return empty array if no pending doctors (instead of null/undefined)
    res.json(pendingDoctors || []);
  } catch (error) {
    // Detailed error logging
    console.error('Error fetching pending doctors:', error);
    console.error('Error details:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    
    // Send appropriate error response
    if (error.code === 'ER_NO_SUCH_TABLE') {
      res.status(500).json({ message: 'Database table not found. Please check database setup.' });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      res.status(500).json({ message: 'Invalid database field. Please check query structure.' });
    } else {
      res.status(500).json({ message: 'Error fetching pending doctor applications' });
    }
  } finally {
    // Always release the connection back to the pool
    if (connection) connection.release();
  }
});

// Get all active doctors
app.get('/api/admin/doctors', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [doctors] = await dbPool.query(
      `SELECT d.id as doctorId, u.id as userId, u.firstName, u.lastName, u.email, u.phone, 
       d.specialization, d.licenseNumber, d.hospital, d.experience, d.education, d.status, u.createdAt 
       FROM doctors d 
       JOIN users u ON d.userId = u.id 
       WHERE d.status != 'pending'`
    );
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Update doctor status (approve/reject)
app.put('/api/admin/doctors/:doctorId/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    await dbPool.query('UPDATE doctors SET status = ? WHERE id = ?', [status, doctorId]);
    
    res.json({ message: `Doctor status updated to ${status}` });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({ message: 'Error updating doctor status' });
  }
});

// Appointment management endpoints
// Create appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { doctorId, appointmentDate, notes } = req.body;
    const userId = req.user.userId; // This is the user ID from the users table

    // Validate user is a patient
    if (req.user.userType !== 'patient') {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    // Get patient ID from patients table using the userId
    const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
    if (patientData.length === 0) {
      return res.status(404).json({ message: 'Patient profile not found for this user' });
    }
    const patientTableId = patientData[0].id; // This is the ID from the patients table

    // Create appointment using the pool
    const [result] = await dbPool.query(
      'INSERT INTO appointments (patientId, doctorId, appointmentDate, notes) VALUES (?, ?, ?, ?)',
      [patientTableId, doctorId, appointmentDate, notes]
    );

    res.status(201).json({
      message: 'Appointment created successfully',
      appointmentId: result.insertId
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ message: 'Error creating appointment' });
  }
});

// Get user appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    let appointments = [];

    if (userType === 'patient') {
      // Get patient ID using the pool
      const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
      if (patientData.length > 0) {
        // Get patient appointments with doctor info using the pool
        const [patientAppointments] = await dbPool.query(
          `SELECT a.*, d.specialization, u.firstName as doctorFirstName, u.lastName as doctorLastName,
           CONCAT(u.firstName, ' ', u.lastName) as doctorName
           FROM appointments a
           JOIN doctors d ON a.doctorId = d.id
           JOIN users u ON d.userId = u.id
           WHERE a.patientId = ?
           ORDER BY a.appointmentDate DESC`,
          [patientData[0].id]
        );
        appointments = patientAppointments;
      }
      
      // If no appointments found, return an empty array with a message
      if (appointments.length === 0) {
        return res.json([{message: 'None'}]);
      }
    } else if (userType === 'doctor') {
      // Get doctor ID using the pool
      const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
      if (doctorData.length > 0) {
        // Get doctor appointments with patient info using the pool
        const [doctorAppointments] = await dbPool.query(
          `SELECT a.*, u.firstName as patientFirstName, u.lastName as patientLastName
           FROM appointments a
           JOIN patients p ON a.patientId = p.id
           JOIN users u ON p.userId = u.id
           WHERE a.doctorId = ?
           ORDER BY a.appointmentDate DESC`,
          [doctorData[0].id]
        );
        appointments = doctorAppointments;
      }
    }

    res.json(appointments);
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// Get unrated completed appointments
app.get('/api/appointments/unrated', authenticateToken, async (req, res) => {
  try {
    const [appointments] = await dbPool.query(`
      SELECT a.*, 
        d.firstName AS doctor_first_name, 
        d.lastName AS doctor_last_name
      FROM appointments a
      LEFT JOIN rating r ON a.id = r.appointmentId
      JOIN doctors d ON a.doctorId = d.id
      WHERE a.status = 'completed'
      AND r.appointmentId IS NULL
      AND a.patientId = ?
      ORDER BY a.appointmentDate DESC
    `, [req.user.userId]);
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update appointment status
app.put('/api/appointments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Verify appointment exists and user has permission using the pool
    let hasPermission = false;

    if (userType === 'patient') {
      const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
      if (patientData.length > 0) {
        const [appointment] = await dbPool.query(
          'SELECT * FROM appointments WHERE id = ? AND patientId = ?',
          [id, patientData[0].id]
        );
        hasPermission = appointment.length > 0;
      }
    } else if (userType === 'doctor') {
      const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
      if (doctorData.length > 0) {
        const [appointment] = await dbPool.query(
          'SELECT * FROM appointments WHERE id = ? AND doctorId = ?',
          [id, doctorData[0].id]
        );
        hasPermission = appointment.length > 0;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to update this appointment' });
    }

    // Update appointment using the pool
    await dbPool.query(
      'UPDATE appointments SET status = ?, notes = ? WHERE id = ?',
      [status, notes, id]
    );

    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Appointment update error:', error);
    res.status(500).json({ message: 'Error updating appointment' });
  }
});

// Medical Records endpoints
app.post('/api/medicalrecords', authenticateToken, async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, prescription, notes } = req.body; // patientId here is the ID from the patients table
    const userId = req.user.userId; // This is the user ID from the users table

    // Validate user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create medical records' });
    }

    // Get doctor ID from doctors table using the userId
    const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
    if (doctorData.length === 0) {
      return res.status(404).json({ message: 'Doctor profile not found for this user' });
    }
    const doctorTableId = doctorData[0].id; // This is the ID from the doctors table

    // Create medical record using the pool
    const [result] = await dbPool.query(
      'INSERT INTO medicalrecord (patientId, doctorId, appointmentId, diagnosis, prescription, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [patientId, doctorTableId, appointmentId, diagnosis, prescription, notes]
    );

    res.status(201).json({
      message: 'Medical record created successfully',
      recordId: result.insertId
    });
  } catch (error) {
    console.error('Medical record creation error:', error);
    res.status(500).json({ message: 'Error creating medical record' });
  }
});

// Get patient medical records
app.get('/api/medicalrecords/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params; // This is the ID from the patients table
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Verify user has permission (patient viewing own records or doctor) using the pool
    let hasPermission = false;

    if (userType === 'patient') {
      const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
      // Ensure the requested patientId matches the ID associated with the logged-in user
      hasPermission = patientData.length > 0 && patientData[0].id.toString() === patientId;
    } else if (userType === 'doctor') {
      // Doctors can view any patient's records they are associated with via appointments or direct query
      // For simplicity here, allowing access, but real-world might need more checks
      hasPermission = true;
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'You do not have permission to view these records' });
    }

    // Get medical records with doctor info using the pool
    const [records] = await dbPool.query(
      `SELECT m.*, u.firstName as doctorFirstName, u.lastName as doctorLastName, d.specialization
       FROM medicalrecord m
       JOIN doctors d ON m.doctorId = d.id
       JOIN users u ON d.userId = u.id
       WHERE m.patientId = ?
       ORDER BY m.createdAt DESC`,
      [patientId]
    );

    res.json(records);
  } catch (error) {
    console.error('Medical records fetch error:', error);
    res.status(500).json({ message: 'Error fetching medical records' });
  }
});
// Messaging endpoints
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body; // receiverId is the user ID from the users table
    const senderId = req.user.userId; // senderId is the user ID from the users table

    // Validate input
    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    // Create message using the pool
    const [result] = await dbPool.query(
      'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]
    );

    res.status(201).json({
      message: 'Message sent successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Message sending error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Get messages between two users
app.get('/api/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    // Get messages using the pool with more user info
    const [messages] = await dbPool.query(
      `SELECT m.*, 
        s.firstName as senderFirstName, 
        s.lastName as senderLastName, 
        s.userType as senderUserType,
        r.firstName as receiverFirstName, 
        r.lastName as receiverLastName,
        r.userType as receiverUserType
       FROM messages m
       JOIN users s ON m.senderId = s.id
       JOIN users r ON m.receiverId = r.id
       WHERE (m.senderId = ? AND m.receiverId = ?) OR (m.senderId = ? AND m.receiverId = ?)
       ORDER BY m.createdAt ASC`,
      [userId, otherUserId, otherUserId, userId]
    );

    // Mark messages as read (optional, could be a separate endpoint)
    await dbPool.query(
      'UPDATE messages SET isRead = TRUE WHERE senderId = ? AND receiverId = ? AND isRead = FALSE',
      [otherUserId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Get all conversations for the current user
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Different query based on user type
    let query;
    
    if (userType === 'doctor') {
      // For doctors: Get all patients they've communicated with
      query = `
        SELECT DISTINCT 
          u.id as userId, 
          u.firstName, 
          u.lastName, 
          u.userType,
          p.id as patientId
        FROM users u
        JOIN patients p ON u.id = p.userId
        WHERE u.id IN (
          SELECT senderId FROM messages WHERE receiverId = ?
          UNION
          SELECT receiverId FROM messages WHERE senderId = ?
        )
        AND u.userType = 'patient'
      `;
    } else {
      // For patients: Get all doctors they've communicated with
      query = `
        SELECT DISTINCT 
          u.id as userId, 
          u.firstName, 
          u.lastName, 
          u.userType,
          d.id as doctorId,
          d.specialization,
          d.hospital
        FROM users u
        JOIN doctors d ON u.id = d.userId
        WHERE u.id IN (
          SELECT senderId FROM messages WHERE receiverId = ?
          UNION
          SELECT receiverId FROM messages WHERE senderId = ?
        )
        AND u.userType = 'doctor'
      `;
    }
    
    const [conversations] = await dbPool.query(
      query,
      [userId, userId]
    );

    res.json(conversations);
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

// Create a new conversation (start messaging with a doctor/patient)
app.post('/api/conversations', authenticateToken, async (req, res) => {
  try {
    // Accept both userId and doctorId for flexibility
    const { userId: receiverUserId, doctorId } = req.body;
    const senderUserId = req.user.userId;
    const userType = req.user.userType;
    
    let doctorUserId;
    
    // If receiverUserId is provided directly, use it
    if (receiverUserId) {
      doctorUserId = receiverUserId;
    }
    // Otherwise, look up the userId associated with the doctorId
    else if (doctorId) {
      // Verify the doctor exists and is active
      const [doctors] = await dbPool.query(
        `SELECT d.id, u.id as userId, u.firstName, u.lastName, u.userType, d.specialization 
         FROM doctors d 
         JOIN users u ON d.userId = u.id 
         WHERE d.id = ? AND d.status = 'active'`,
        [doctorId]
      );
    
      if (doctors.length === 0) {
        return res.status(404).json({ message: 'Doctor not found or not active' });
      }
      
      doctorUserId = doctors[0].userId;
    } else {
      return res.status(400).json({ message: 'Either userId or doctorId is required' });
    }
    
    // Only patients can initiate conversations with doctors for now
    if (userType !== 'patient') {
      return res.status(403).json({ message: 'Only patients can initiate conversations with doctors' });
    }
    
    // Verify users aren't starting conversations with themselves
    if (senderUserId === doctorUserId) {
      return res.status(400).json({ message: 'Cannot start a conversation with yourself' });
    }
    
    // Check if conversation already exists
    const [existingMessages] = await dbPool.query(
      `SELECT id FROM messages 
       WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) 
       LIMIT 1`,
      [senderUserId, doctorUserId, doctorUserId, senderUserId]
    );
    
    // Get doctor information for the response
    const [doctorInfo] = await dbPool.query(
      `SELECT u.id as userId, u.firstName, u.lastName, u.userType, d.id as doctorId, d.specialization 
       FROM users u 
       JOIN doctors d ON u.id = d.userId 
       WHERE u.id = ?`,
      [doctorUserId]
    );
    
    if (doctorInfo.length === 0) {
      return res.status(404).json({ message: 'Doctor user not found' });
    }
    
    // If conversation doesn't exist, create an initial message
    if (existingMessages.length === 0) {
      const initialMessage = 'Hello, I would like to start a conversation.';
  
      await dbPool.query(
        'INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)',
        [senderUserId, doctorUserId, initialMessage]
      );
    }
    
    // Return the conversation details
    res.status(201).json({
      userId: doctorUserId,  // Important - return the userId (not doctorId)
      firstName: doctorInfo[0].firstName,
      lastName: doctorInfo[0].lastName,
      userType: doctorInfo[0].userType,
      doctorId: doctorInfo[0].doctorId,
      specialization: doctorInfo[0].specialization,
      message: 'Conversation started successfully'
    });
  } catch (error) {
    console.error('Conversation creation error:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// Rating endpoints
app.get('/api/ratings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    let ratings = [];

    if (userType === 'patient') {
      // Get patient ID
      const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
      if (patientData.length > 0) {
        const patientId = patientData[0].id;
        
        // Get ratings made by this patient
        const [patientRatings] = await dbPool.query(
          `SELECT r.*, 
            u.firstName as patientFirstName, u.lastName as patientLastName,
            d.userId as doctorUserId
           FROM rating r
           JOIN patients p ON r.patientId = p.id
           JOIN users u ON p.userId = u.id
           JOIN doctors d ON r.doctorId = d.id
           ORDER BY r.createdAt DESC`,
        );
        
        ratings = patientRatings.map(rating => ({
          ...rating,
          patientName: `${rating.patientFirstName} ${rating.patientLastName}`
        }));
      }
    } else if (userType === 'doctor') {
      // Get doctor ID
      const [doctorData] = await dbPool.query('SELECT id FROM doctors WHERE userId = ?', [userId]);
      if (doctorData.length > 0) {
        const doctorId = doctorData[0].id;
        
        // Get ratings for this doctor, including appointmentId
        const [doctorRatings] = await dbPool.query(
          `SELECT r.*, 
            u.firstName as patientFirstName, u.lastName as patientLastName,
            r.appointmentId
           FROM rating r
           JOIN patients p ON r.patientId = p.id
           JOIN users u ON p.userId = u.id
           WHERE r.doctorId = ?
           ORDER BY r.createdAt DESC`,
          [doctorId]
        );
        
        ratings = doctorRatings.map(rating => ({
          ...rating,
          patientName: `${rating.patientFirstName} ${rating.patientLastName}`
        }));
      }
    } else if (userType === 'admin') {
      // Admins can see all ratings
      const [allRatings] = await dbPool.query(
        `SELECT r.*, 
          up.firstName as patientFirstName, up.lastName as patientLastName,
          ud.firstName as doctorFirstName, ud.lastName as doctorLastName
         FROM rating r
         JOIN patients p ON r.patientId = p.id
         JOIN users up ON p.userId = up.id
         JOIN doctors d ON r.doctorId = d.id
         JOIN users ud ON d.userId = ud.id
         ORDER BY r.createdAt DESC`
      );
      
      ratings = allRatings.map(rating => ({
        ...rating,
        patientName: `${rating.patientFirstName} ${rating.patientLastName}`,
        doctorName: `Dr. ${rating.doctorFirstName} ${rating.doctorLastName}`
      }));
    }

    res.json(ratings);
  } catch (error) {
    console.error('Ratings fetch error:', error);
    res.status(500).json({ message: 'Error fetching ratings' });
  }
});

// Create a new rating
app.post('/api/ratings', authenticateToken, async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, review } = req.body;
    const userId = req.user.userId;
    
    // Validate input
    if (!doctorId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Doctor ID and valid rating (1-5) are required' });
    }
    
    // Verify user is a patient
    if (req.user.userType !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit ratings' });
    }
    
    // Get patient ID
    const [patientData] = await dbPool.query('SELECT id FROM patients WHERE userId = ?', [userId]);
    if (patientData.length === 0) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }
    const patientId = patientData[0].id;
    
    // If appointmentId is provided, verify it belongs to this patient and doctor
    if (appointmentId) {
      const [appointment] = await dbPool.query(
        'SELECT * FROM appointments WHERE id = ? AND patientId = ? AND doctorId = ?',
        [appointmentId, patientId, doctorId]
      );
      
      if (appointment.length === 0) {
        return res.status(404).json({ message: 'Appointment not found or does not belong to this patient and doctor' });
      }
      
      // Check if appointment is already rated
      const [existingRating] = await dbPool.query(
        'SELECT * FROM rating WHERE appointmentId = ?',
        [appointmentId]
      );
      
      if (existingRating.length > 0) {
        return res.status(400).json({ message: 'This appointment has already been rated' });
      }
    }
    
    // Create rating
    const [result] = await dbPool.query(
      'INSERT INTO rating (patientId, doctorId, appointmentId, rating, review) VALUES (?, ?, ?, ?, ?)',
      [patientId, doctorId, appointmentId || null, rating, review || null]
    );
    
    // Update appointment if provided
    if (appointmentId) {
      await dbPool.query(
        'UPDATE appointments SET isRated = TRUE WHERE id = ?',
        [appointmentId]
      );
    }
    
    // Get the created rating with user info
    const [createdRating] = await dbPool.query(
      `SELECT r.*, 
        u.firstName as patientFirstName, u.lastName as patientLastName
       FROM rating r
       JOIN patients p ON r.patientId = p.id
       JOIN users u ON p.userId = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );
    
    if (createdRating.length > 0) {
      const ratingWithNames = {
        ...createdRating[0],
        patientName: `${createdRating[0].patientFirstName} ${createdRating[0].patientLastName}`
      };
      
      res.status(201).json(ratingWithNames);
    } else {
      res.status(201).json({ id: result.insertId, message: 'Rating submitted successfully' });
    }
  } catch (error) {
    console.error('Rating creation error:', error);
    res.status(500).json({ message: 'Error submitting rating' });
  }
});

// Get active doctors endpoint (for patients starting new conversations)
app.get('/api/patients/doctors/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    // Only patients can access this endpoint
    if (userType !== 'patient') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all active doctors the patient hasn't messaged yet
    const [activeDoctors] = await dbPool.query(
      `SELECT 
        u.id as userId, 
        d.id as doctorId,
        u.firstName,
        u.lastName,
        u.userType,
        d.specialization,
        d.hospital
      FROM doctors d
      JOIN users u ON d.userId = u.id
      WHERE d.status = 'active'
      AND u.id NOT IN (
        SELECT senderId FROM messages WHERE receiverId = ?
        UNION
        SELECT receiverId FROM messages WHERE senderId = ?
      )`,
      [userId, userId]
    );
    
    res.json(activeDoctors);
  } catch (error) {
    console.error('Active doctors fetch error:', error);
    res.status(500).json({ message: 'Error fetching active doctors' });
  }
});

// Admin endpoints (Protected)
const authorizeAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};


// Get all users (for admin)
app.get('/api/admin/users', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [users] = await dbPool.query('SELECT id, firstName, lastName, email, userType, createdAt FROM users ORDER BY createdAt DESC');
    res.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all doctors (for admin)
app.get('/api/admin/doctors', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [doctors] = await dbPool.query(
        `SELECT u.id as userId, u.firstName, u.lastName, u.email, d.* 
         FROM doctors d 
         JOIN users u ON d.userId = u.id 
         ORDER BY u.createdAt DESC`
    );
    res.json(doctors);
  } catch (error) {
    console.error('Doctors fetch error:', error);
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Get all patients (for admin)
app.get('/api/admin/patients', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [patients] = await dbPool.query(
        `SELECT u.id as userId, u.firstName, u.lastName, u.email, p.* 
         FROM patients p 
         JOIN users u ON p.userId = u.id 
         ORDER BY u.createdAt DESC`
    );
    res.json(patients);
  } catch (error) {
    console.error('Patients fetch error:', error);
    res.status(500).json({ message: 'Error fetching patients' });
  }
});


app.get('/api/prescription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [prescriptions] = await dbPool.query(
      `SELECT mr.* 
       FROM medicalrecord AS mr
       JOIN patients AS p ON p.id = mr.patientId
       WHERE p.userId = ?`,
      [userId]
    );
    res.json(prescriptions);
  } catch (error) {
    console.error('Prescription fetch error:', error);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

app.put('/api/admin/status', authenticateToken, async (req, res) => {
  try {
      const { userId, status } = req.body;

      // Validate userId and status
      if (!userId || !status || !['active', 'inactive'].includes(status)) {
          return res.status(400).json({
              message: 'Invalid userId or status value. Status must be "active" or "inactive".'
          });
      }

      // Get user type and update corresponding tables
      const [[userType]] = await dbPool.query(
          'SELECT userType FROM users WHERE id = ?',
          [userId]
      );

      if (!userType) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Update specialized tables based on user type
      if (userType.userType === 'doctor') {
        await dbPool.query(
              'UPDATE doctors SET status = ? WHERE userId = ?',
              [status, userId]
          );
      } else if (userType.userType === 'patient') {
          await dbPool.query(
              'UPDATE patients SET status = ? WHERE userId = ?',
              [status, userId]
          );
      }

      res.json({
          message: 'Status updated successfully',
      });

  } catch (error) {
      console.error('Status update error:', error);
      res.status(500).json({ 
          message: 'Error updating status',
          errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
});


// Initialize the database before starting the server
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});

// Endpoint to get appointments filtered by patientId and status
app.get('/api/appointmentRecord', authenticateToken, async (req, res) => {
  const { patientId, status } = req.query;
  if (!patientId || !status) {
    return res.status(400).json({ message: 'Both patientId and status are required' });
  }
  try {
    const [appointments] = await dbPool.query(
      `SELECT a.*, d.firstName AS doctorFirstName, d.lastName AS doctorLastName
      FROM appointments a
      JOIN doctors doc ON a.doctorId = doc.id
      JOIN users d ON doc.userId = d.id
      WHERE a.patientId = ? 
        AND a.status = ?
        AND NOT EXISTS (
          SELECT 1 
          FROM medicalrecord mr 
          WHERE mr.appointmentId = a.id
        )
      ORDER BY a.appointmentDate DESC`,
      [patientId, status]
    );
    const formatted = appointments.map(apt => ({
      id: apt.id.toString(),
      doctorId: apt.doctorId.toString(),
      doctorName: `Dr. ${apt.doctorFirstName} ${apt.doctorLastName}`,
      date: new Date(apt.appointmentDate),
      status: apt.status,
      type: apt.appointmentType,
      isRated: false
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching filtered appointments:', err);
    res.status(500).json({ message: 'Server error fetching appointments' });
  }
});

// Search doctors endpoint
app.get('/api/doctors/search', async (req, res) => {
  try {
    const { query } = req.query; // Search by name or specialization

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchQuery = `%${query}%`;

    const [doctors] = await dbPool.query(
      `SELECT u.id as userId, u.firstName, u.lastName, d.id as doctorId, d.specialization, d.hospital, d.experience 
       FROM doctors d 
       JOIN users u ON d.userId = u.id 
       WHERE d.status = 'active' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR d.specialization LIKE ?)
       ORDER BY u.firstName, u.lastName`,
      [searchQuery, searchQuery, searchQuery]
    );

    res.json(doctors);
  } catch (error) {
    console.error('Doctor search error:', error);
    res.status(500).json({ message: 'Error searching doctors' });
  }
});