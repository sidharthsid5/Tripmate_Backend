var con = require("./connection");
// Function to calculate distance using Haversine formula

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }
  
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }


function fetchAndCalculateDistance(tourId, interest, currentLoc, days, userId) {
  // Define the starting time
  let startTime = new Date();
  startTime.setHours(7, 0, 0); // Set starting time to 7:00 AM
  
  // Fetch data from the districts table based on current_loc
  const districtQuery = `SELECT DistrictName, Latitude, Longitude FROM Districts WHERE DistrictName = ?`;
  con.query(districtQuery, [currentLoc], (districtErr, districtRows) => {
      if (districtErr) {
          console.error('Error fetching data from districts table:', districtErr);
          return;
      }
      if (districtRows.length === 0) {
          console.log('No district found for the given current location:', currentLoc);
          return;
      }

      // Extract district coordinates
      const district = districtRows[0];
      const districtLatitude = district.Latitude;
      const districtLongitude = district.Longitude;

      // Fetch data from the places table
      let placesQuery = `SELECT location, latitude, longitude, loc_id FROM places WHERE`;
      if (interest.length === 1) {
          // If only one interest is selected, use a simple WHERE clause
          placesQuery += ` category = '${interest[0]}'`;
      } else {
          // If multiple interests are selected, use the IN operator
          const interestList = interest.map(i => `'${i}'`).join(',');
          placesQuery += ` category IN (${interestList})`;
      }

      con.query(placesQuery, (placesErr, placesRows) => {
          if (placesErr) {
              console.error('Error fetching data from places table:', placesErr);
              return;
          }

          // Calculate distances for each place
          const sortedPlaces = placesRows.map(place => {
              const distance = calculateDistance(districtLatitude, districtLongitude, place.latitude, place.longitude);
              return { ...place, distance };
          }).sort((a, b) => a.distance - b.distance);

          // Select locations based on number of days
          let selectedPlaces = [];
          const numberOfPlacesPerDay = 4; // Number of places to select per day
          for (let i = 0; i < days; i++) {
              const startIndex = i * numberOfPlacesPerDay;
              const endIndex = startIndex + numberOfPlacesPerDay;
              const placesForDay = sortedPlaces.slice(startIndex, endIndex);
              selectedPlaces = [...selectedPlaces, ...placesForDay];
          }
          

          // Insert selected places into the TourSchedule table
          const insertQuery = `INSERT INTO TourSchedule (tourId, uid, distance, loc_id, time) VALUES (?, ?, ?, ?, ?)`;
          selectedPlaces.forEach((place, index) => {
              const time = new Date(startTime.getTime() + index * 3 * 60 * 60 * 1000); // Increment time by 3 hours for each place
              const formattedTime = formatTime(time); // Format the time
              const dayNumber = Math.floor(index / numberOfPlacesPerDay) + 1;
              con.query(insertQuery, [tourId, userId, place.distance, place.loc_id, formattedTime], (insertErr, result) => {
                  if (insertErr) {
                      console.error('Error inserting place into TourSchedule:', insertErr);
                  } else {
                      console.log(`Inserted place ${place.location} into TourSchedule with time ${formattedTime} for Day ${dayNumber}`);
                  }
              });
          });
      });
  });
}

// Function to format the time as "hh:mm am/pm"
function formatTime(time) {
  let hours = time.getHours();
  let minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const formattedTime = hours + ':' + minutes + ' ' + ampm;
  return formattedTime;
}





  module.exports = {
    calculateDistance,
    deg2rad,
    fetchAndCalculateDistance
  };