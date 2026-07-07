"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Link2, FileText, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    nic: '',
    dob: '',
    university: '',
    degree: '',
    year: '1',
    skills: '',
    portfolio: '',
    github: '',
    linkedin: '',
    mobileNumber: '',
    address: '',
    emergencyContact: '',
    positionApplied: 'Software Engineer Intern',
    departmentName: 'Engineering',
    preferredTech: '',
    availability: 'Immediate (Full-Time)',
    agreement: false,
  });

  const [cvFile, setCvFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreement) {
      setError('You must agree to the internship policy checkbox.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = new FormData();
      // Append text fields
      Object.keys(formData).forEach((key) => {
        data.append(key, (formData as any)[key]);
      });
      // Append CV file
      if (cvFile) {
        data.append('cv', cvFile);
      }

      const res = await fetch('/api/auth/register-intern', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(result.message);
        // Reset form
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError('An error occurred during submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-900 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          {!logoError ? (
            <img 
              src="/logo.png" 
              alt="Logo" 
              onError={() => setLogoError(true)} 
              className="w-20 h-20 object-contain mx-auto mb-3 dark:invert"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 mb-3 font-bold text-lg border border-zinc-200 mx-auto">
              IT
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">IdeaTech Internship Application</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">IdeaTech (PVT) LTD | Internship Lifecycle Portal</p>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  step >= s 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 scale-110 shadow-sm' 
                    : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className={`h-[2px] w-12 rounded transition-all duration-200 ${step > s ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-800'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="p-4 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-red-600 dark:text-red-400 text-sm text-center font-semibold">{error}</div>}
        {message && <div className="p-4 mb-6 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-green-600 dark:text-green-400 text-sm text-center font-semibold">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Personal details */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-zinc-800 dark:text-zinc-200">
                <User size={16} className="text-zinc-500" />
                <span>Step 1: Personal Credentials</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="name@university.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Portal Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">National ID Card (NIC) *</label>
                  <input
                    type="text"
                    name="nic"
                    required
                    value={formData.nic}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. 2001XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    required
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. +9477XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Emergency Contact Info *</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    required
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Name + Relationship + Phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Residential Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="Enter current home address"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                >
                  <span>Next Step</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Education details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-zinc-800 dark:text-zinc-200">
                <GraduationCap size={16} className="text-zinc-500" />
                <span>Step 2: Educational Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">University *</label>
                  <input
                    type="text"
                    name="university"
                    required
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. University of Moratuwa"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Degree Title *</label>
                  <input
                    type="text"
                    name="degree"
                    required
                    value={formData.degree}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. B.Sc. in Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Academic Year *</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Preferred Department *</label>
                  <select
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Quality Assurance">Quality Assurance (QA)</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Skills (Comma-separated) *</label>
                <textarea
                  name="skills"
                  required
                  rows={3}
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  placeholder="React, Express, PyTorch, Figma, Jenkins"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold text-xs transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                >
                  <span>Next Step</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Professional profile links & uploads */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-zinc-800 dark:text-zinc-200">
                <Link2 size={16} className="text-zinc-500" />
                <span>Step 3: Profiles & Uploads</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Position Applied For *</label>
                  <input
                    type="text"
                    name="positionApplied"
                    required
                    value={formData.positionApplied}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Software Engineer Intern"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Preferred Technology Stack</label>
                  <input
                    type="text"
                    name="preferredTech"
                    value={formData.preferredTech}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Next.js, Node, MERN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">GitHub URL</label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Portfolio Link</label>
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="https://mywebsite.com"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Availability *</label>
                  <input
                    type="text"
                    name="availability"
                    required
                    value={formData.availability}
                    onChange={handleInputChange}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Immediate, 1 Month Notice"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 font-bold uppercase tracking-wider">Upload CV (PDF only) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="pt-4 space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreement"
                    checked={formData.agreement}
                    onChange={handleInputChange}
                    className="mt-1 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-900 focus:ring-zinc-500"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                    I agree to the internship policy of **IdeaTech (PVT) LTD**. I acknowledge that WFH attendance logging, daily reports, and logbook entries are mandatory, and failure to log activity for 5 consecutive days triggers automatic termination.
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-bold text-xs transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Previous</span>
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs transition-colors shadow-sm"
                >
                  {loading ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
