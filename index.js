var con = require("./connection");
var express = require('express');
var app = express();
const cors = require('cors');
const session = require('express-session');
var bodyParser = require('body-parser');
const { calculateDistance, deg2rad, fetchAndCalculateDistance } = require('./model.js');
const router = express.Router();

// Enable CORS for all routes
app.use(session({
  secret: 'youet_key',
  resave: false,
  saveUninitialized: true
}));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json()); 


app.post('/signin', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'SELECT uid FROM user_details WHERE uemail = ? AND upasword = ?';
  con.query(sql, [email, password], (err, results) => {
    if (err) {
      console.error('MySQL query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 1) {
      const userId = results[0].uid;
      req.session.userId = userId;
      return res.json({ userId });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  });
});


app.post('/signup', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var lastName = req.body.lastName;
    var password = req.body.password;
    var sex = req.body.sex;
    var age = req.body.age;
    var country = req.body.country;
    var currentYear = req.body.currentYear;
    console.log(req.body);

    var sql = "INSERT INTO user_details(uname, ulastName, uemail, upasword,uage,country,usex,visitedyear) VALUES (?, ?, ?, ?,?, ?, ?, ?)";
    con.query(sql, [name, lastName, email, password,age,country,sex,currentYear], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Registration failed' });
        }

        res.send('Inserted');
    });
});




app.post('/location', (req, res) => {
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var user = req.body.user;
  const userId = req.session.userId;
  console.log(req.body);
  console.log(userId);

  var sql = "INSERT INTO coordinates(latitude, longitude,uid) VALUES (?, ?,?)";
  con.query(sql, [latitude, longitude,user], (error, result) => {
      if (error) {
          console.log(error)
          return res.status(500).json({ success: false, message: 'Insertion failed' });
      }

      res.send('Inserted');
  });
});


app.post('/createSchedule/:userId', (req, res) => {
  try {
      const districtName = req.body.location;
      const days = req.body.days;
      const interest = req.body.interests;
      const userId = req.params.userId; 
      
      const selectQuery = `SELECT DistrictID FROM Districts WHERE DistrictName = ?`;

     
      con.query(selectQuery, [districtName], (selectErr, selectResult) => {
          if (selectErr) {
              console.error('Error fetching DistrictID from Districts:', selectErr);
              res.status(500).json({ success: false, message: 'Internal server error' });
          } else {
              if (selectResult.length === 0) {
                  
                  console.error(`District '${districtName}' not found in Districts table.`);
                  res.status(404).json({ success: false, message: 'District not found' });
              } else {
                  const districtId = selectResult[0].DistrictID;
                  console.log(`District '${districtName}' found with ID '${districtId}' in Districts table.`);

                 
                  const insertQuery = `INSERT INTO TourPlans (UserID, DayNumber, LocationID) VALUES (?, ?, ?)`;


                  con.query(insertQuery, [userId, days, districtId], (insertErr, result) => {
                      if (insertErr) {
                          console.error('Error inserting into TourPlans:', insertErr);
                          res.status(500).json({ success: false, message: 'Internal server error' });
                      } else {
                        
                          const tourId = result.insertId;
                          console.log('Inserted tourId:', tourId);
                          req.session.tourId = tourId;

                        
                          fetchAndCalculateDistance(tourId, interest, districtName, days, userId, (err, sortedPlaces) => {
                              if (err) {
                                  console.error('Error fetching places:', err);
                                  res.status(500).json({ success: false, message: 'Internal server error' });
                              } else {
                                  res.status(200).json({ success: true, sortedPlaces });
                              }
                          });
                      }
                  });
              }
          }
      });

  } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


app.get('/tourSchedules/:tourId', (req, res) => {
  const tourId = req.params.tourId;
  const sql = 'SELECT places.loc_id, places.location, places.time,places.category,TourSchedule.distance,TourSchedule.tourId,TourSchedule.Time,TourSchedule.schedule_id FROM TourSchedule INNER JOIN places ON TourSchedule.loc_id = places.loc_id WHERE TourSchedule.tourId = ? ORDER BY TourSchedule.distance ASC';
  
  // 'SELECT distance FROM TourSchedule where tourId=1';

  con.query(sql,[tourId], (err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      // console.log(tourId)
    }
  });
});


app.get('/scheduleHistory/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT tp.TourID, tp.LocationID, tp.Date, tp.UserID, tp.DayNumber, p.DistrictName
    FROM TourPlans tp
    JOIN Districts p ON tp.LocationID = p.DistrictID
    WHERE tp.UserID = ? ORDER BY tp.TourID DESC;
  `;

  con.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      // console.log(result);
    }
  });
});

//admin all history

app.get('/scheduleHistoryss', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT tp.TourID, tp.LocationID, tp.Date, tp.UserID, tp.DayNumber, p.DistrictName
    FROM TourPlans tp
    JOIN Districts p ON tp.LocationID = p.DistrictID
   ORDER BY tp.TourID DESC;
  `;

  con.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      // console.log(result);
    }
  });
});



  app.get('/deleteSchedules', (req, res) => {
    var sql = "DELETE FROM TourSchedule WHERE tourId=1";
    // var id = req.query.uid;
    con.query(sql, (error, result) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Failed to delete user details' });
        }
        res.redirect('/deleteSchedules');
    });
});

app.get('/socialMedia', (req, res) => {

  const sql = 'SELECT * FROM final1';
  
  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
     
    }
  });
});

app.get('/placedetails', (req, res) => {

  const sql = 'SELECT * FROM places ORDER BY priority ASC';
  
  

  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      //  console.log(result)
    }
  });
});


app.get('/touristdetails', (req, res) => {

  const sql = 'SELECT * FROM tourism_data ';
  
  // 'SELECT distance FROM TourSchedule where tourId=1';

  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
      //  console.log(result)
    }
  });
});


app.get('/tourschedules/:id', (req, res) => {
  const scheduleId = req.params.id;
  con.query('DELETE FROM TourSchedule WHERE schedule_id=?', [scheduleId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Database query failed' });
    }
    if (results.length > 0) {
      return res.json(results[0]);
    } else {
      return res.status(404).json({ error: 'Schedule not found' });
    }
  });
});


app.delete('/editSchedules/:scheduleId', (req, res) => {
  const scheduleId = parseInt(req.params.scheduleId);
  var sql = "DELETE FROM TourSchedule WHERE schedule_id=?";
 
  con.query(sql, [scheduleId], (error, result) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: 'Failed to delete schedule' });
    }
    res.status(200).json({ success: true, message: 'Schedule deleted successfully' });
  });
});

app.get('/place/:placeId', (req, res) => {
  const placeId = parseInt(req.params.placeId); // Parse placeId to integer

  // Validate placeId
  if (isNaN(placeId) || placeId <= 0) {
    return res.status(400).json({ message: 'Invalid placeId, must be a positive integer' });
  }

  try {
    // Fetch place details based on loc_id
    const sql = 'SELECT loc_id, location, image FROM places WHERE loc_id = ?';
    con.query(sql, [placeId], (err, result) => {
      if (err) {
        console.error('Error fetching place details:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'Place not found' });
      }

      // Extract place details from the result
      const place = result[0]; // Assuming there's only one place with the given placeId

      // Prepare response
      const response = {
        id: place.loc_id,
        location: place.location,
        imageUrl: place.image,
        // Add more fields as needed
      };

      // Send the response
      res.json(response);
    });

  } catch (err) {
    console.error('Error fetching place details', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT *FROM user_details WHERE uid = ?';
  con.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  });
});

app.get('/UserList', (req, res) => {

  const sql = 'SELECT * FROM user_details WHERE uid <> 1 ORDER BY uname';
  
  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching tour schedules:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
     
    }
  });
});




// Delete user by userId
app.delete('/deleteUser/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = 'DELETE FROM user_details WHERE uid = ?';

  con.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Failed to delete user' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  });
});

// Update user by userId
app.put('/updateUser/:userId', (req, res) => {
  const userId = req.params.userId;
  const { firstName, lastName, email } = req.body;
  const sql = 'UPDATE user_details SET uname = ?, ulastName = ?, uemail = ? WHERE uid = ?';

  con.query(sql, [firstName, lastName, email, userId], (err, result) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).json({ message: 'Failed to update user' });
    }
    res.status(200).json({ message: 'User updated successfully' });
  });
});





app.post('/addevent', (req, res) => {
  const { name, eventPlace, description, startDate, endDate } = req.body;

  if (!name || !eventPlace || !description || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Name, event place, description, start date, and end date are required.',
    });
  }


  const isValidDate = (date) => !isNaN(Date.parse(date));
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format for start date or end date.',
    });
  }

  console.log(req.body);

  const sql = 'INSERT INTO events (event_name, event_place, description, start_date, end_date) VALUES (?, ?, ?, ?, ?)';
  con.query(sql, [name, eventPlace, description, startDate, endDate], (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Failed to add event.' });
    }

    res.status(200).json({ success: true, message: 'Event added successfully.' });
  });
});

// Get All Events
app.get('/events', (req, res) => {
  const sql = 'SELECT * FROM events ORDER BY start_date DESC';
  con.query(sql, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve events.',
      });
    }

    res.status(200).json({ success: true, data: results });
  });
});

// Delete Event by ID
app.delete('/events/:eventId', (req, res) => {
  const eventId = req.params.eventId;

  if (isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  const sql = 'DELETE FROM events WHERE event_id = ?';
  con.query(sql, [eventId], (err, result) => {
    if (err) {
      console.error('Error deleting event:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  });
});


app.get('/coordinates', (req, res) => {
  const sql = 'SELECT latitude, longitude FROM graph_coordinates';
  
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching coordinates:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No coordinates found' });
    }

    // Return the coordinates, they should already be floats (numbers)
    res.json({ data: result });
  });
});



//abhijith table
app.get('/Placesss', (req, res) => {

  const sql = 'SELECT * FROM places ';
  
  con.query(sql,(err, result) => {
    if (err) {
      console.error('Error fetching Place:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
     
    }
  });
});



// //new table api calls


app.get('/coordinates1', (req, res) => {
  const sql = 'SELECT * FROM coordinates';
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching coordinates:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});

app.get('/graphCoordinates1', (req, res) => {
  const sql = 'SELECT * FROM graph_coordinates';
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching graph coordinates:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});


app.get('/placesTable', (req, res) => {
  const sql = 'SELECT district, location, category, time, latitude, longitude, image, description FROM places';

  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching places:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});



app.get('/tourismData1', (req, res) => {
  const sql = 'SELECT * FROM tourism_data';

  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching tourism data:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});

// Clustering and similarity

app.get('/coordinates2', (req, res) => {
  const sql = 'SELECT * FROM coordinates';
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching coordinates:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(result);
    }
  });
});


app.listen(4000, () => {
  console.log('Server is running on port 4000');
});