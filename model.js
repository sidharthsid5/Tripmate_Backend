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

//   function fetchAndCalculateDistance(currentLoc, days) {
//     // Fetch data from the districts table based on current_loc
//     const districtQuery = `SELECT DistrictName, Latitude, Longitude FROM Districts WHERE DistrictName = ?`;
//     con.query(districtQuery, [currentLoc], (districtErr, districtRows) => {
//       if (districtErr) {
//         console.error('Error fetching data from districts table:', districtErr);
//         return;
//       }
//       if (districtRows.length === 0) {
//         console.log('No district found for the given current location:', currentLoc);
//         return;
//       }
  
//       // Extract district coordinates
//       const district = districtRows[0];
//       const districtLatitude = district.Latitude;
//       const districtLongitude = district.Longitude;
  
//       // Fetch data from the places table
//       const placesQuery = `SELECT location, latitude, longitude FROM places`;
//       con.query(placesQuery, (placesErr, placesRows) => {
//         if (placesErr) {
//           console.error('Error fetching data from places table:', placesErr);
//           return;
//         }
  
//         // Calculate distances for each place
//         const sortedPlaces = placesRows.map(place => {
//           const distance = calculateDistance(districtLatitude, districtLongitude, place.latitude, place.longitude);
//           return { ...place, distance };
//         }).sort((a, b) => a.distance - b.distance);
  
//         // Display sorted places
//         console.log('Sorted places based on distance from', currentLoc, ':');
//         sortedPlaces.forEach(place => {
//           console.log(place.location, '-', place.distance.toFixed(2), 'km');
//         });
//       });
//     });
//   }
// Function to fetch data from MySQL and perform calculations


function fetchAndCalculateDistance(tourId, interest,currentLoc, days) {
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
      // const placesQuery = `SELECT location, latitude, longitude FROM places where category ='${interest}'`;
       placesQuery = `SELECT location, latitude, longitude,loc_id FROM places WHERE`;
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
        const numberOfPlacesPerDay = 3; // Number of places to select per day
        for (let i = 0; i < days; i++) {
          const startIndex = i * numberOfPlacesPerDay;
          const endIndex = startIndex + numberOfPlacesPerDay;
          const placesForDay = sortedPlaces.slice(startIndex, endIndex);
          selectedPlaces = [...selectedPlaces, ...placesForDay];
        }
        
        // Display selected places
        console.log(`Selected places for ${days} days based on distance from ${currentLoc}:`);
        s=selectedPlaces.forEach(place => {
          console.log(place.location, '-', place.distance.toFixed(2), 'km');
        });
        const insertQuery = `INSERT INTO TourSchedule (tourId, distance,loc_id) VALUES (?,?,?)`;
            selectedPlaces.forEach(place => {
                con.query(insertQuery, [tourId, place.distance,place.loc_id], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error inserting place into TourSchedule:', insertErr);
                    }
                });
            });
        });
    });
}
  module.exports = {
    calculateDistance,
    deg2rad,
    fetchAndCalculateDistance
  };