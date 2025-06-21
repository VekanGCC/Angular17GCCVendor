const mongoose = require('mongoose');
const Skill = require('../models/Skill');

const skills = [
  {
    name: 'JavaScript',
    category: 'Programming Languages',
    description: 'A high-level, interpreted programming language.',
    isActive: true
  },
  {
    name: 'Python',
    category: 'Programming Languages',
    description: 'A versatile, high-level programming language.',
    isActive: true
  },
  {
    name: 'React',
    category: 'Frameworks & Libraries',
    description: 'A JavaScript library for building user interfaces.',
    isActive: true
  },
  {
    name: 'Node.js',
    category: 'Frameworks & Libraries',
    description: 'A JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
    isActive: true
  },
  {
    name: 'MongoDB',
    category: 'Databases',
    description: 'A NoSQL database program.',
    isActive: true
  },
  {
    name: 'AWS',
    category: 'Cloud Platforms',
    description: 'Amazon Web Services, a cloud computing platform.',
    isActive: true
  },
  {
    name: 'Docker',
    category: 'DevOps & Tools',
    description: 'A platform for developing, shipping, and running applications.',
    isActive: true
  },
  {
    name: 'iOS Development',
    category: 'Mobile Development',
    description: 'Development for Apple\'s iOS platform.',
    isActive: true
  },
  {
    name: 'Data Analysis',
    category: 'Data Science & Analytics',
    description: 'The process of inspecting, cleansing, transforming, and modeling data.',
    isActive: true
  },
  {
    name: 'Cybersecurity',
    category: 'Cybersecurity',
    description: 'The practice of protecting systems, networks, and programs from digital attacks.',
    isActive: true
  }
];

mongoose.connect('mongodb://127.0.0.1:27017/venkan', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    await Skill.insertMany(skills);
    console.log('Skills added successfully');
  } catch (error) {
    console.error('Error adding skills:', error);
  } finally {
    mongoose.disconnect();
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
}); 