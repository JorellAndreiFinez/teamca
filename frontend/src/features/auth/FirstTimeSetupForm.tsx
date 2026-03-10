// account setup for init login
import React, { useState } from 'react';

export default function FirstTimeSetupForm() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
    department_id: 0,
    school_university: '',
    required_hours: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Complete Your Account Setup</h2>
      {/* form fields */}
    </form>
  );
}