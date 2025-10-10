const { db } = require('../firebaseAdmin');

// Function to fetch top-rated entities for a given category
const getTopRatedEntities = async (refPath, limit = 5) => {
  try {
    const ref = db.ref(refPath);
    const snapshot = await ref.once('value');
    const entities = snapshot.val() || {};

    // Convert to array, filter out entities without ratings, and sort by rating
    const entityList = Object.values(entities)
      .filter(entity => entity.rating && entity.reviewCount > 0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, limit);

    return entityList.map(entity => ({
      id: entity.id,
      name: entity.name || 'Unnamed',
      rating: parseFloat(entity.rating) || 0,
      reviewCount: entity.reviewCount || 0,
      city: entity.city || 'Not specified',
      image: entity.collegeImage || entity.schoolImage || entity.centerImage || entity.profileImage || '',
      type: refPath // e.g., 'schools', 'colleges', etc.
    }));
  } catch (error) {
    console.error(`Error fetching top-rated entities from ${refPath}:`, error);
    return [];
  }
};

// Controller to get best sellers (top-rated entities across all categories)
const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5; // Allow client to specify limit, default to 5

    // Fetch top-rated entities for each category
    const topSchools = await getTopRatedEntities('schools', limit);
    const topColleges = await getTopRatedEntities('colleges', limit);
    const topPUColleges = await getTopRatedEntities('pucolleges', limit);
    const topTuitionCoachings = await getTopRatedEntities('tuitioncoaching', limit);
    
    // Fetch top-rated professional teachers
    const professionalTeachersSnapshot = await db.ref('teachers').once('value');
    const professionalTeachers = Object.values(professionalTeachersSnapshot.val() || {})
      .filter(teacher => teacher.institutionType && ['school', 'college', 'pu college', 'coaching institute'].includes(teacher.institutionType.toLowerCase()))
      .filter(teacher => teacher.rating && teacher.reviewCount > 0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, limit)
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name || 'Unnamed',
        rating: parseFloat(teacher.rating) || 0,
        reviewCount: teacher.reviewCount || 0,
        city: teacher.city || 'Not specified',
        image: teacher.profileImage || '',
        type: 'professional_teachers'
      }));

    // Fetch top-rated personal mentors
    const personalMentorsSnapshot = await db.ref('teachers').once('value');
    const personalMentors = Object.values(personalMentorsSnapshot.val() || {})
      .filter(teacher => teacher.institutionType && teacher.institutionType.toLowerCase() === 'personal mentor')
      .filter(teacher => teacher.rating && teacher.reviewCount > 0)
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
      .slice(0, limit)
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name || 'Unnamed',
        rating: parseFloat(teacher.rating) || 0,
        reviewCount: teacher.reviewCount || 0,
        city: teacher.city || 'Not specified',
        image: teacher.profileImage || '',
        type: 'personal_mentors'
      }));

    res.status(200).json({
      success: true,
      data: {
        schools: topSchools,
        colleges: topColleges,
        puColleges: topPUColleges,
        tuitionCoaching: topTuitionCoachings,
        professionalTeachers: professionalTeachers,
        personalMentors: personalMentors
      }
    });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch best sellers',
      error: error.message
    });
  }
};

module.exports = { getBestSellers };