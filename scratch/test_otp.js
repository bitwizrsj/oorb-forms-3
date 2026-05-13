import axios from 'axios';

const testRegistration = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Test User',
      email: 'test' + Math.random() + '@example.com',
      password: 'password123'
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testRegistration();
