/**
 * Geokodiranje adrese u geografske koordinate (OpenStreetMap Nominatim)
 * Bez potrebe za eksternim API ključevima.
 */
export async function geocodeAddress(address, city = '') {
  try {
    const fullQuery = `${address}${city ? ', ' + city : ''}, Serbia`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'HouseBuilding-App/1.0 (contact: office@housebuilding.local)'
      }
    });

    const data = await res.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.error('Greška pri geokodiranju adrese:', err.message);
  }

  return { latitude: null, longitude: null };
}