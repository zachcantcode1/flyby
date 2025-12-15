export const AIRCRAFT_TYPE_IMAGES: Record<string, string> = {
    // Airbus
    'A319': 'https://image.airport-data.com/aircraft/001093486.jpg', // Using A320 image as fallback
    'A320': 'https://image.airport-data.com/aircraft/001093486.jpg', // Verified A320 (American)
    'A321': 'https://image.airport-data.com/aircraft/001093486.jpg', // Using A320 image as fallback
    'A333': 'https://image.airport-data.com/aircraft/001766274.jpg', // Using A350 image as fallback (Widebody)
    'A359': 'https://image.airport-data.com/aircraft/001766274.jpg', // Verified A350 (Finnair OH-LWA)
    'A388': 'https://image.airport-data.com/aircraft/001573491.jpg', // Verified A380 (Emirates A6-EUA)

    // Boeing
    'B737': 'https://image.airport-data.com/aircraft/001600279.jpg', // Verified B738 (Delta)
    'B738': 'https://image.airport-data.com/aircraft/001600279.jpg', // Verified B738 (Delta N864DA)
    'B739': 'https://image.airport-data.com/aircraft/001600279.jpg', // Verified B738 (Delta)
    'B744': 'https://image.airport-data.com/aircraft/001753303.jpg', // Using B777 as widebody fallback
    'B748': 'https://image.airport-data.com/aircraft/001753303.jpg', // Using B777 as widebody fallback
    'B752': 'https://image.airport-data.com/aircraft/001600279.jpg', // Using B738 as narrowbody fallback
    'B763': 'https://image.airport-data.com/aircraft/001753303.jpg', // Using B777 as widebody fallback
    'B77W': 'https://image.airport-data.com/aircraft/001753303.jpg', // Verified B777-300ER (American N718AN)
    'B788': 'https://image.airport-data.com/aircraft/001753303.jpg', // Using B777 as widebody fallback
    'B789': 'https://image.airport-data.com/aircraft/001753303.jpg', // Using B777 as widebody fallback

    // Regional / Business
    'E175': 'https://image.airport-data.com/aircraft/001913374.jpg', // Verified E175 (Republic/United N117HQ)
    'E190': 'https://image.airport-data.com/aircraft/001913374.jpg', // Verified E175
    'CRJ2': 'https://image.airport-data.com/aircraft/001803843.jpg', // Using CL35 as generic regional/biz
    'CRJ7': 'https://image.airport-data.com/aircraft/001913374.jpg', // Verified E175
    'CRJ9': 'https://image.airport-data.com/aircraft/001913374.jpg', // Verified E175
    'CL35': 'https://image.airport-data.com/aircraft/001803843.jpg', // Verified Challenger 350 (N501BZ)
    'CL60': 'https://image.airport-data.com/aircraft/001803843.jpg', // Verfiied Challenger 350
    'GLF4': 'https://image.airport-data.com/aircraft/001803843.jpg', // Verified Challenger 350
    'GLF5': 'https://image.airport-data.com/aircraft/001803843.jpg', // Verified Challenger 350
    'GLF6': 'https://image.airport-data.com/aircraft/001803843.jpg', // Verified Challenger 350

    // Turboprops
    'SW4': 'https://image.airport-data.com/aircraft/001762034.jpg', // Verified Metroliner (Ameriflight N245DH)
    'PC12': 'https://image.airport-data.com/aircraft/114314.jpg',   // Verified PC-12 (HB-FOA)
    'DH8D': 'https://image.airport-data.com/aircraft/001562049.jpg', // Verified Q400 (Horizon N404QX)
    'Q400': 'https://image.airport-data.com/aircraft/001562049.jpg', // Verified Q400
    'AT72': 'https://image.airport-data.com/aircraft/001562049.jpg', // Using Q400 as generic turboprop airliner
    'AT43': 'https://image.airport-data.com/aircraft/001562049.jpg', // Using Q400
    'BE20': 'https://image.airport-data.com/aircraft/114314.jpg',    // Using PC-12 as generic business turboprop
    'B350': 'https://image.airport-data.com/aircraft/114314.jpg',    // Using PC-12 as generic business turboprop
    'C208': 'https://image.airport-data.com/aircraft/001601987.jpg', // Verified Cessna Caravan (N208CN)

    // GA
    'C172': 'https://image.airport-data.com/aircraft/001601987.jpg', // Using Caravan as generic high-wing GA
    'SR22': 'https://image.airport-data.com/aircraft/114314.jpg'     // Using PC-12 as generic low-wing GA match
};
