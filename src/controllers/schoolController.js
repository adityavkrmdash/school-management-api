const db = require('../config/db')

function calcDistance(a, b, c, d) {
    const rad = Math.PI / 180
    const dLat = (c - a) * rad
    const dLon = (d - b) * rad

    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(dLon / 2) ** 2

    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

exports.addSchool = async (req, res) => {
    const { name, address, latitude, longitude } = req.body

    if (!name || !address) return res.status(400).json({ error: 'missing name/address' })

    if (latitude == null || longitude == null) {
        return res.status(400).json({ error: 'missing coordinates' })
    }

    const lat = Number(latitude)
    const lon = Number(longitude)

    if (isNaN(lat) || isNaN(lon)) return res.status(400).json({ error: 'bad coordinates' })

    if (lat < -90 || lat > 90) return res.status(400).json({ error: 'bad latitude' })
    if (lon < -180 || lon > 180) {
        return res.status(400).json({ error: 'bad longitude' })
    }

    try {
        const q = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)'
        const [r] = await db.execute(q, [name, address, lat, lon])

        return res.status(201).json({ id: r.insertId, message: 'saved' })
    } catch (e) {
        console.error('addSchool', e)
        return res.status(500).json({ error: 'db error' })
    }
}

exports.listSchools = async (req, res) => {
    const { latitude, longitude } = req.query

    if (latitude == null || longitude == null) return res.status(400).json({ error: 'missing coordinates' })

    const lat = Number(latitude)
    const lon = Number(longitude)

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'bad coordinates' })
    }

    try {
        const [rows] = await db.execute('SELECT * FROM schools')

        if (!rows.length) return res.json({ total: 0, data: [] })

        const data = rows.map(s => ({
            ...s,
            distance_km: parseFloat(
                calcDistance(lat, lon, s.latitude, s.longitude).toFixed(2)
            )
        }))

        data.sort((a, b) => a.distance_km - b.distance_km)

        return res.json({ total: data.length, data })
    } catch (e) {
        console.error('listSchools', e)
        return res.status(500).json({ error: 'db error' })
    }
}