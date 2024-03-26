var con = require("./connection");
var express = require('express');
var app = express();
const cors = require('cors');
var bodyParser = require('body-parser');
const { calculateDistance, deg2rad, fetchAndCalculateDistance } = require('./model.js');

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.post('/signup', (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var lastName = req.body.lastName;
    var password = req.body.password;
    console.log(req.body);

    var sql = "INSERT INTO user_details(uname, ulastName, uemail, upasword) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, lastName, email, password], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Registration failed' });
        }

        res.send('Inserted');
    });
});
app.post('/interest', async (req, res) => {
    
     
      var location = req.body.location;
      var days = req.body.days;
      var interest = req.body.interests;
      console.log(req.body);
    //   if (!current_loc || !interest) {
    //     current_loc = "loc"; 
    //     interest = "No ";// Set a default value if current_loc is not provided
    //   }
    //   var sql = "INSERT INTO interest(current_loc, days, interest) VALUES ( ?, ?, ?)";
    //   con.query(sql, [location, days, interest], (error, result) => {
        
    //       if (error) {
    //           console.log(error)
    //           return res.status(500).json({ success: false, message: ' failed' });
   
    var sql = "INSERT INTO interest (current_loc, days, interest) VALUES ";
    var values = interest.map(interests => `('${location}', '${days}', '${interests}')`).join(', ');

    // Append the multiple value sets to the INSERT query
    sql += values;

    // Execute the INSERT query
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Insertion failed' });
      }
          res.send('Inserted');
      });
    }
    
),

// app.post('/fetch_districts', async (req, res) => {
//     try {
//         const currentLoc = req.body.location;
//         const days = parseInt(req.body.days); // Assuming 'days' is a number
        
//         // Fetch latitude and longitude of current location from the 'district' table
//         const currentLocQuery = "SELECT Latitude, Longitude FROM Districts WHERE DistrictName = ?";
//         con.query(currentLocQuery, [currentLoc], async (error, currentLocResults) => {
//           if (error) {
//             console.error('Error fetching current location data:', error);
//             return res.status(500).json({ success: false, message: 'Internal server error' });
//           }
    
//           if (currentLocResults.length === 0) {
//             return res.status(404).json({ success: false, message: 'Current location not found' });
//           }
    
//           const { latitude: currentLat, longitude: currentLng } = currentLocResults[0];
    
//           // Calculate distance between current location and all other districts using Haversine formula
//           const distanceQuery = "SELECT DistrictName, Latitude, Longitude, " +
//                                 "(6371 * acos(cos(radians(?)) * cos(radians(Latitude)) * cos(radians(Longitude) - radians(?)) + " +
//                                 "sin(radians(?)) * sin(radians(Latitude)))) AS distance " +
//                                 "FROM Districts WHERE DistrictName != ? ORDER BY distance";
          
//           con.query(distanceQuery, [currentLat, currentLng, currentLat, currentLoc], async (error, distanceResults) => {
//             if (error) {
//               console.error('Error fetching distances:', error);
//               return res.status(500).json({ success: false, message: 'Internal server error' });
//             }
    
//             // Take the least short districts according to the number of days
//             const selectedDistricts = distanceResults.slice(0, days);
    
//             // Fetch required information for the selected districts
//             const selectedDistrictNames = selectedDistricts.map(district => district.district_name);
//             const districtInfoQuery = "SELECT DistrictName, Latitude, Longitude FROM Districts WHERE DistrictName IN (?)";
            
//             con.query(districtInfoQuery, [selectedDistrictNames], async (error, districtInfoResults) => {
//               if (error) {
//                 console.error('Error fetching district info:', error);
//                 return res.status(500).json({ success: false, message: 'Internal server error' });
//               }
    
//               // Send the selected districts information as response
//               res.json({ success: true, data: districtInfoResults });
//             });
//           });
//         });
//       } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//       }
//     });

// Route to fetch places


// app.post('/places', (req, res) => {
//   try {
//     const districtName = req.body.location;
//     const days = req.body.days;

//     // Fetch latitude and longitude of the selected district
//     con.query('SELECT Latitude, Longitude FROM Districts WHERE DistrictName = ?', [districtName], (err, districtResults) => {
//       if (err) {
//         console.error('Error fetching district data:', err);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//       }

//       const district = districtResults[0]; // Assuming only one district with the given name

//       // Fetch all places with their latitude and longitude
//       con.query('SELECT location, latitude, longitude FROM places', (err, placesResults) => {
//         if (err) {
//           console.error('Error fetching places data:', err);
//           return res.status(500).json({ success: false, message: 'Internal server error' });
//         }

//         // Calculate distance between district and each place
//         const sortedPlaces = placesResults.map(place => {
//           const distance = haversineDistance(district.Latitude, district.Longitude, place.latitude, place.longitude);
//           return { location: place.location, distance };
//         }).sort((a, b) => a.distance - b.distance); // Sort places by distance

//         // Respond with sorted places
//         res.json({ success: true, places: sortedPlaces });
//       });
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

// // Function to calculate distance using Haversine formula
// function haversineDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; // Radius of the Earth in km
//   const dLat = deg2rad(lat2 - lat1);
//   const dLon = deg2rad(lon2 - lon1);
//   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//             Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
//             Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   const distance = R * c; // Distance in km
//   return distance;
// }

// // Function to convert degrees to radians
// function deg2rad(deg) {
//   return deg * (Math.PI / 180);
// }









// Function to fetch data from MySQL and perform calculations

// Route to fetch places based on district name and days
app.post('/place', (req, res) => {
  try {
    const districtName = req.body.location;
    const days = req.body.days;

    // Call function to fetch and calculate distances
    fetchAndCalculateDistance(districtName, days);

    res.status(200).send('Places fetched successfully');
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});







app.post('/signin', (req, res) => {

    var email = req.body.email;
    var password = req.body.password;
    var userId = req.body.userId;
    console.log(req.body);

    // res.status(500).json({ success: false, message: 'Login failed' })

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check credentials against the database
    var sql = 'SELECT uid FROM user_details WHERE uemail = ? AND upasword = ?';
    con.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('MySQL query error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 1) {
            const userId = results[0].uid;
            res.json({ userId });

            //res.json({ message: 'Login successful' });
        } else {

            res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

app.post('/location', (req, res) => {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var user = req.body.user;
    console.log(req.body);

    var sql = "INSERT INTO coordinates(latitude, longitude,uid) VALUES (?, ?,?)";
    con.query(sql, [latitude, longitude,user], (error, result) => {
        if (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: 'Insertion failed' });
        }

        res.send('Inserted');
    });
});

// app.get('/user_details', (req, res) => {
//     var sql = "SELECT * FROM user_details";
//     con.query(sql, (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
//         }
//         res.render(__dirname + "/user_details", { user_details: result });
//     });
// });

// app.get('/delete-user_details', (req, res) => {
//     var sql = "DELETE FROM user_details WHERE uid=?";
//     var id = req.query.uid;
//     con.query(sql, [id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to delete user details' });
//         }
//         res.redirect('/user_details');
//     });
// });

// app.get('/update-user_details', (req, res) => {
//     var sql = "SELECT * FROM user_details WHERE uid=?";
//     var id = req.query.uid;
//     con.query(sql, [id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to fetch user details for update' });
//         }
//         res.render(__dirname + "/update_user", { user_details: result });
//     });
// });

// app.post('/update-user_details', (req, res) => {
//     var name = req.body.name;
//     var email = req.body.email;
//     var id = req.body.id;

//     var sql = "UPDATE user_details SET uname=?, uemail=? WHERE uid=?";
//     con.query(sql, [name, email, id], (error, result) => {
//         if (error) {
//             console.log(error);
//             return res.status(500).json({ success: false, message: 'Failed to update user details' });
//         }
//         res.redirect('/user_details');
//     });
// });

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
