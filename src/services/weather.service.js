/**
 * Dohvaća trenutne vremenske podatke za zadane GPS koordinate preko Open-Meteo API-ja
 */
export async function getCurrentWeather(latitude, longitude) {
  try {
    const lat = latitude || 45.5136; // Melenci default
    const lng = longitude || 20.3169;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    const current = data.current_weather;
    
    // Tumačenje WMO vremenskih kodova
    const weatherCodes = {
      0: 'Vedro i sunčano',
      1: 'Pretežno vedro',
      2: 'Djelomično oblačno',
      3: 'Oblačno',
      45: 'Magla',
      51: 'Slaba kiša / rosi',
      61: 'Kiša',
      63: 'Jaka kiša',
      71: 'Snijeg',
      95: 'Grmljavinsko nevrijeme'
    };

    return {
      temperature: current.temperature,
      windSpeed: current.windspeed,
      weatherDesc: weatherCodes[current.weathercode] || 'Promjenjivo'
    };
  } catch (err) {
    console.error('Greška pri dohvatu meteo podataka:', err.message);
    return null;
  }
}