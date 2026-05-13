import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import {
  FiPackage,
  FiDollarSign,
  FiMapPin,
  FiPercent,
  FiSave,
  FiX,
  FiArrowLeft,
  FiUpload,
  FiCamera,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiCalendar,
  FiBarChart,
  FiTrendingUp,
  FiActivity,
  FiClock,
  FiStar,
  FiLock,
  FiDatabase,
  FiHeart,
} from "react-icons/fi";
import {
  MdLocalHospital,
  MdVerifiedUser,
  MdMedication,
  MdScience,
  MdAdminPanelSettings,
  MdHealthAndSafety,
  MdSecurity,
  MdBiotech,
  MdInventory,
  MdMonitorHeart,
} from "react-icons/md";
import {
  FaUserMd,
  FaStethoscope,
  FaHospitalUser,
  FaPrescriptionBottleAlt,
  FaHeartbeat,
  FaNotesMedical,
  FaAmbulance,
  FaSyringe,
  FaUserNurse,
  FaMicroscope,
  FaXRay,
  FaThermometerHalf,
  FaBrain,
  FaEye,
  FaTooth,
  FaBone,
  FaLungs,
  FaPills,
  FaVial,
} from "react-icons/fa";

import { Card, Button, Input, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import ipfsService from "../../utils/ipfs";
import { truncateAddress } from "../../utils/helpers";

import toast from "react-hot-toast";

const MedicineImageUpload = ({ onImageUpdate, loading }) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [medicineImages, setMedicineImages] = useState([]);
  const [uploadedHashes, setUploadedHashes] = useState([]);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select valid image files only");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image should be less than 5MB");
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedImages = [];

      for (const file of files) {
        // Create preview
        const reader = new FileReader();
        const imageUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        setMedicineImages((prev) => [...prev, imageUrl]);

        // Upload to IPFS
        const ipfsResult = await ipfsService.uploadToIPFS(file, {
          name: `medicine-image-${Date.now()}`,
          type: "medicine-image",
        });

        uploadedImages.push(ipfsResult.hash);
      }

      setUploadedHashes((prev) => [...prev, ...uploadedImages]);
      onImageUpdate([...uploadedHashes, ...uploadedImages]);
      toast.success("Medicine images uploaded successfully!");
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setMedicineImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedHashes((prev) => prev.filter((_, i) => i !== index));
    onImageUpdate(uploadedHashes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {medicineImages.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Medicine ${index + 1}`}
              className="w-full h-32 object-cover rounded-2xl border-2 border-blue-200 shadow-lg"
            />
            <Button
              variant="outline"
              size="small"
              className="absolute top-2 right-2 p-2 bg-red-500 border-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              onClick={() => removeImage(index)}
            >
              <FiX className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Enhanced Upload placeholder */}
        <label className="cursor-pointer group">
          <div className="w-full h-32 border-2 border-dashed border-blue-300 rounded-2xl flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            {uploading ? (
              <div className="text-center">
                <LoadingSpinner size="small" />
                <p className="text-xs text-blue-600 mt-2">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200">
                  <FiCamera className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm text-blue-600 font-medium mt-2">
                  Add Images
                </span>
              </>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading || loading}
          />
        </label>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <FiInfo className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">
              Image Upload Guidelines
            </p>
            <p className="text-xs text-blue-700">
              Upload up to 5 high-quality images. Supported formats: JPG, PNG,
              GIF. Maximum size: 5MB each. Images help patients identify
              medicines accurately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAddMedicine = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);

  const [medicineForm, setMedicineForm] = useState({
    name: "",
    description: "",
    manufacturer: "",
    category: "",
    type: "",
    dosage: "",
    strength: "",
    price: "",
    quantity: "",
    discount: "0",
    location: "",
    expiryDate: "",
    batchNumber: "",
    activeIngredient: "",
    sideEffects: "",
    contraindications: "",
    instructions: "",
    prescriptionRequired: false,
    images: [],
  });

  const [formErrors, setFormErrors] = useState({});

  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();

  const { addMedicine, getUserType, getAllMedicines } =
    useHealthcareContract();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // For development - skip admin validation
        // In production, uncomment these checks:
        /*
        if (!isConnected || !address) {
          router.push("/admin/login");
          return;
        }

        const userInfo = await getUserType(address);
        if (!userInfo || userInfo.userType !== "admin") {
          router.push("/admin/login");
          return;
        }
        */

        setAdminData({
          address: address || '',
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast.error("Failed to load admin data");
        // Don't redirect in development
        // router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isConnected, address]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMedicineForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImagesUpdate = (images) => {
    setMedicineForm((prev) => ({
      ...prev,
      images,
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!medicineForm.name.trim()) errors.name = "Medicine name is required";
    if (!medicineForm.manufacturer.trim())
      errors.manufacturer = "Manufacturer is required";
    if (!medicineForm.category) errors.category = "Category is required";
    if (!medicineForm.type) errors.type = "Medicine type is required";
    if (!medicineForm.price || parseFloat(medicineForm.price) <= 0) {
      errors.price = "Valid price is required";
    }
    if (!medicineForm.quantity || parseInt(medicineForm.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
    }
    if (!medicineForm.location.trim()) errors.location = "Location is required";
    if (!medicineForm.dosage.trim()) errors.dosage = "Dosage is required";

    // Price validation
    if (medicineForm.price && parseFloat(medicineForm.price) > 1000) {
      errors.price = "Price seems too high. Please verify.";
    }

    // Discount validation
    if (
      medicineForm.discount &&
      (parseFloat(medicineForm.discount) < 0 ||
        parseFloat(medicineForm.discount) > 90)
    ) {
      errors.discount = "Discount must be between 0% and 90%";
    }

    // Expiry date validation
    if (medicineForm.expiryDate) {
      const expiryDate = new Date(medicineForm.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        errors.expiryDate = "Expiry date must be in the future";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMedicine = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setSaving(true);

      // Prepare medicine data for IPFS
      const medicineData = {
        name: medicineForm.name,
        description: medicineForm.description,
        manufacturer: medicineForm.manufacturer,
        category: medicineForm.category,
        type: medicineForm.type,
        dosage: medicineForm.dosage,
        strength: medicineForm.strength,
        activeIngredient: medicineForm.activeIngredient,
        sideEffects: medicineForm.sideEffects,
        contraindications: medicineForm.contraindications,
        instructions: medicineForm.instructions,
        expiryDate: medicineForm.expiryDate,
        batchNumber: medicineForm.batchNumber,
        prescriptionRequired: medicineForm.prescriptionRequired,
        images: medicineForm.images,
        addedBy: address,
        addedAt: new Date().toISOString(),
      };

      console.log("Uploading medicine data to IPFS:", medicineData);

      // Upload metadata to IPFS
      const ipfsResult = await ipfsService.uploadJSONToIPFS(medicineData, {
        name: `medicine-metadata-${medicineForm.name}`,
        type: "medicine-metadata",
      });

      console.log("IPFS upload result:", ipfsResult);

      // Add medicine via Fabric backend
      const txResult = await addMedicine({
        ipfsUrl: ipfsResult.url,
        name: medicineForm.name || '',
        price: parseFloat(medicineForm.price),
        quantity: parseInt(medicineForm.quantity),
        discount: parseInt(medicineForm.discount) || 0,
        location: medicineForm.location,
        category: medicineForm.category || '',
        manufacturer: medicineForm.manufacturer || '',
        description: medicineForm.description || '',
      });

      console.log("Transaction result:", txResult);

      toast.success("Medicine added successfully!");

      // Reset form after successful submission
      resetForm();

      // Optionally redirect to medicines list
      // router.push("/admin/medicines");
    } catch (error) {
      console.error("Error adding medicine:", error);

      // More specific error handling
      if (error.message?.includes("Only admin can perform this action")) {
        toast.error(
          "Only admin can add medicines. Please check your permissions."
        );
      } else if (error.message?.includes("User rejected the request")) {
        toast.error("Transaction was cancelled by user");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds to complete the transaction");
      } else {
        toast.error(
          `Failed to add medicine: ${
            error.shortMessage || error.message || "Unknown error"
          }`
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setMedicineForm({
      name: "",
      description: "",
      manufacturer: "",
      category: "",
      type: "",
      dosage: "",
      strength: "",
      price: "",
      quantity: "",
      discount: "0",
      location: "",
      expiryDate: "",
      batchNumber: "",
      activeIngredient: "",
      sideEffects: "",
      contraindications: "",
      instructions: "",
      prescriptionRequired: false,
      images: [],
    });
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="p-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-2xl">
              <FaPrescriptionBottleAlt className="h-16 w-16 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-300 rounded-full animate-ping"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-indigo-300 rounded-full animate-ping animation-delay-1000"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-6 text-gray-700 font-bold text-lg">
            Loading Medicine Management...
          </p>
          <p className="text-sm text-gray-600 mt-2">Initializing admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden pointer-events-none">
        <FaPrescriptionBottleAlt className="absolute top-20 right-20 h-32 w-32 text-purple-600 animate-pulse" />
        <FaStethoscope className="absolute bottom-20 left-20 h-24 w-24 text-indigo-600" />
        <MdMedication className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-8 text-white shadow-2xl border-2 border-purple-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>

        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-6">
            <Button
              variant="outline"
              size="small"
              onClick={() => router.push("/admin/dashboard")}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiArrowLeft className="h-4 w-4 mr-2" />
              Back to Medicines
            </Button>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm border border-white border-opacity-30 shadow-lg">
                <FaPrescriptionBottleAlt className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  Add New Medicine
                  <MdMedication className="h-8 w-8" />
                </h1>
                <p className="text-purple-100 text-lg flex items-center gap-2">
                  <MdAdminPanelSettings className="h-4 w-4" />
                  Add pharmaceutical products to the healthcare platform
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={saving}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              <FiX className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
            <Button
              onClick={handleAddMedicine}
              loading={saving}
              disabled={saving || !isConnected}
              className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-opacity-30 backdrop-blur-sm shadow-lg"
            >
              {saving ? (
                <>
                  <LoadingSpinner size="small" color="white" />
                  <span className="ml-2">Adding Medicine...</span>
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4 mr-2" />
                  Add Medicine
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Admin Info */}
        <Card className="bg-white bg-opacity-10 border-white border-opacity-20 backdrop-blur-sm shadow-lg relative z-10">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-2xl shadow-lg">
                <MdAdminPanelSettings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <MdSecurity className="h-5 w-5" />
                  Admin Panel - Medicine Management
                </h3>
                <p className="text-purple-100 font-medium">
                  {isConnected ? (
                    <>
                      Logged in as Admin • {truncateAddress(address)} • Total
                      Medicines: {contractInfo?.medicineCount || 0}
                    </>
                  ) : (
                    <>Please connect your wallet to continue</>
                  )}
                </p>
              </div>
              <div className="ml-auto">
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none shadow-md">
                  <MdVerifiedUser className="w-4 h-4 mr-1" />
                  Admin Access
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Connection Warning */}
        {!isConnected && (
          <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-lg mt-6 relative z-10">
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg">
                  <FiAlertCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 mb-1">
                    Wallet Not Connected
                  </h3>
                  <p className="text-red-700">
                    Please connect your wallet to add medicines to the platform.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Main Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Enhanced Basic Information */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <MdMedication className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Basic Information
                  </h3>
                  <p className="text-gray-600">
                    Essential medicine details and identification
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaPills className="h-4 w-4" />
                    Medicine Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={medicineForm.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Paracetamol"
                    error={formErrors.name}
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MdBiotech className="h-4 w-4" />
                    Manufacturer *
                  </label>
                  <Input
                    type="text"
                    name="manufacturer"
                    value={medicineForm.manufacturer}
                    onChange={handleInputChange}
                    placeholder="e.g., Pfizer, GSK"
                    error={formErrors.manufacturer}
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  />
                  {formErrors.manufacturer && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.manufacturer}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <MdScience className="h-4 w-4" />
                    Category *
                  </label>
                  <Select
                    name="category"
                    value={medicineForm.category}
                    onChange={handleInputChange}
                    error={formErrors.category}
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  >
                    <option value="">Select category</option>
                    <option value="analgesics">Analgesics</option>
                    <option value="antibiotics">Antibiotics</option>
                    <option value="antihistamines">Antihistamines</option>
                    <option value="antacids">Antacids</option>
                    <option value="cardiovascular">Cardiovascular</option>
                    <option value="respiratory">Respiratory</option>
                    <option value="neurological">Neurological</option>
                    <option value="endocrine">Endocrine</option>
                    <option value="dermatological">Dermatological</option>
                    <option value="gastrointestinal">Gastrointestinal</option>
                    <option value="vitamins">Vitamins & Supplements</option>
                    <option value="vaccines">Vaccines</option>
                    <option value="other">Other</option>
                  </Select>
                  {formErrors.category && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaVial className="h-4 w-4" />
                    Medicine Type *
                  </label>
                  <Select
                    name="type"
                    value={medicineForm.type}
                    onChange={handleInputChange}
                    error={formErrors.type}
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  >
                    <option value="">Select type</option>
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream/Ointment</option>
                    <option value="drops">Drops</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="powder">Powder</option>
                    <option value="suppository">Suppository</option>
                    <option value="patch">Patch</option>
                  </Select>
                  {formErrors.type && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaSyringe className="h-4 w-4" />
                    Dosage *
                  </label>
                  <Input
                    type="text"
                    name="dosage"
                    value={medicineForm.dosage}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg, 10ml"
                    error={formErrors.dosage}
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  />
                  {formErrors.dosage && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.dosage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiActivity className="h-4 w-4" />
                    Strength
                  </label>
                  <Input
                    type="text"
                    name="strength"
                    value={medicineForm.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., Extra Strong, Regular"
                    className="border-2 border-blue-200 focus:border-blue-400 rounded-xl shadow-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiInfo className="h-4 w-4" />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={medicineForm.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the medicine and its uses..."
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-md"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Pricing & Inventory */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-xl">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl shadow-lg">
                  <FiDollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Pricing & Inventory
                  </h3>
                  <p className="text-gray-600">
                    Medicine pricing, stock levels, and availability
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiDollarSign className="h-4 w-4" />
                    Price (ETH) *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-emerald-100 rounded-lg">
                      <FiDollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <Input
                      type="number"
                      name="price"
                      value={medicineForm.price}
                      onChange={handleInputChange}
                      placeholder="0.0000"
                      step="0.0001"
                      min="0"
                      className="pl-16 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl shadow-md"
                      error={formErrors.price}
                    />
                  </div>
                  {formErrors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiPackage className="h-4 w-4" />
                    Quantity *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 rounded-lg">
                      <FiPackage className="h-4 w-4 text-blue-600" />
                    </div>
                    <Input
                      type="number"
                      name="quantity"
                      value={medicineForm.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="pl-16 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl shadow-md"
                      error={formErrors.quantity}
                    />
                  </div>
                  {formErrors.quantity && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiPercent className="h-4 w-4" />
                    Discount (%)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-orange-100 rounded-lg">
                      <FiPercent className="h-4 w-4 text-orange-600" />
                    </div>
                    <Input
                      type="number"
                      name="discount"
                      value={medicineForm.discount}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      max="90"
                      className="pl-16 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl shadow-md"
                      error={formErrors.discount}
                    />
                  </div>
                  {formErrors.discount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.discount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiMapPin className="h-4 w-4" />
                    Location/Store *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-purple-100 rounded-lg">
                      <FiMapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <Input
                      type="text"
                      name="location"
                      value={medicineForm.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Main Pharmacy, Store A"
                      className="pl-16 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl shadow-md"
                      error={formErrors.location}
                    />
                  </div>
                  {formErrors.location && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" />
                      {formErrors.location}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Medical Details */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <MdHealthAndSafety className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Medical Details
                  </h3>
                  <p className="text-gray-600">
                    Clinical information and usage guidelines
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <MdBiotech className="h-4 w-4" />
                      Active Ingredient
                    </label>
                    <Input
                      type="text"
                      name="activeIngredient"
                      value={medicineForm.activeIngredient}
                      onChange={handleInputChange}
                      placeholder="e.g., Acetaminophen"
                      className="border-2 border-purple-200 focus:border-purple-400 rounded-xl shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FiPackage className="h-4 w-4" />
                      Batch Number
                    </label>
                    <Input
                      type="text"
                      name="batchNumber"
                      value={medicineForm.batchNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., BT2024001"
                      className="border-2 border-purple-200 focus:border-purple-400 rounded-xl shadow-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <FiCalendar className="h-4 w-4" />
                      Expiry Date
                    </label>
                    <Input
                      type="date"
                      name="expiryDate"
                      value={medicineForm.expiryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      error={formErrors.expiryDate}
                      className="border-2 border-purple-200 focus:border-purple-400 rounded-xl shadow-md"
                    />
                    {formErrors.expiryDate && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="h-3 w-3" />
                        {formErrors.expiryDate}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <div className="flex items-center p-4 bg-white rounded-xl border-2 border-purple-200 shadow-md">
                      <input
                        type="checkbox"
                        id="prescriptionRequired"
                        name="prescriptionRequired"
                        checked={medicineForm.prescriptionRequired}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-2 border-purple-300 rounded"
                      />
                      <label
                        htmlFor="prescriptionRequired"
                        className="ml-3 text-sm font-bold text-gray-900 flex items-center gap-2"
                      >
                        <FiLock className="h-4 w-4 text-purple-600" />
                        Prescription Required
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaNotesMedical className="h-4 w-4" />
                    Usage Instructions
                  </label>
                  <textarea
                    name="instructions"
                    value={medicineForm.instructions}
                    onChange={handleInputChange}
                    placeholder="Detailed instructions on how to use this medicine..."
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-md"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiAlertCircle className="h-4 w-4" />
                    Side Effects
                  </label>
                  <textarea
                    name="sideEffects"
                    value={medicineForm.sideEffects}
                    onChange={handleInputChange}
                    placeholder="List potential side effects..."
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-md"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FiShield className="h-4 w-4" />
                    Contraindications
                  </label>
                  <textarea
                    name="contraindications"
                    value={medicineForm.contraindications}
                    onChange={handleInputChange}
                    placeholder="When this medicine should not be used..."
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-md"
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Medicine Images */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-xl">
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
                  <FiCamera className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Medicine Images
                  </h3>
                  <p className="text-gray-600">
                    Visual identification and product documentation
                  </p>
                </div>
              </div>
              <MedicineImageUpload
                onImageUpdate={handleImagesUpdate}
                loading={saving}
              />
            </div>
          </Card>
        </div>

        {/* Enhanced Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Enhanced Form Progress */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Form Progress
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">
                    Basic Info
                  </span>
                  <Badge
                    className={`text-xs border-none shadow-md ${
                      medicineForm.name && medicineForm.manufacturer
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                    }`}
                  >
                    <FiCheckCircle className="w-3 h-3 mr-1" />
                    {medicineForm.name && medicineForm.manufacturer
                      ? "Complete"
                      : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">
                    Pricing
                  </span>
                  <Badge
                    className={`text-xs border-none shadow-md ${
                      medicineForm.price && medicineForm.quantity
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                        : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                    }`}
                  >
                    <FiCheckCircle className="w-3 h-3 mr-1" />
                    {medicineForm.price && medicineForm.quantity
                      ? "Complete"
                      : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">
                    Medical Details
                  </span>
                  <Badge
                    className={`text-xs border-none shadow-md ${
                      medicineForm.instructions
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                        : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                    }`}
                  >
                    <FiInfo className="w-3 h-3 mr-1" />
                    {medicineForm.instructions ? "Complete" : "Optional"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Platform Statistics */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl shadow-lg">
                  <FiBarChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Platform Statistics
                </h3>
              </div>
              <div className="space-y-6">
                <div className="text-center p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-lg">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl w-fit mx-auto mb-3">
                    <FaPrescriptionBottleAlt className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {contractInfo?.medicineCount || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Medicines
                  </p>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-lg">
                  <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl w-fit mx-auto mb-3">
                    <FaUserMd className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mb-1">
                    {contractInfo?.doctorCount || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Registered Doctors
                  </p>
                </div>
                <div className="text-center p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-lg">
                  <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl w-fit mx-auto mb-3">
                    <FaHospitalUser className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-600 mb-1">
                    {contractInfo?.patientCount || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Registered Patients
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Guidelines */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                  <MdHealthAndSafety className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">
                  Medicine Guidelines
                </h3>
              </div>
              <div className="space-y-4 text-sm text-blue-800">
                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    Ensure all medicine information is accurate and up-to-date
                  </span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Upload clear, high-quality images of the medicine</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Verify expiry dates before adding to inventory</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <FiCheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Set appropriate prices considering market rates</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <FiAlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Mark prescription-only medicines appropriately</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Price Calculator */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Price Calculator
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-gray-600 font-medium">Base Price:</span>
                  <span className="font-bold text-emerald-600">
                    {medicineForm.price ? `${medicineForm.price} ETH` : "0 ETH"}
                  </span>
                </div>
                <div className="flex justify-between text-sm p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-gray-600 font-medium">Discount:</span>
                  <span className="font-bold text-orange-600">
                    -{medicineForm.discount || 0}%
                  </span>
                </div>
                <div className="border-t-2 border-emerald-200 pt-4">
                  <div className="flex justify-between text-sm font-bold p-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl shadow-lg">
                    <span>Final Price:</span>
                    <span>
                      {medicineForm.price && medicineForm.discount
                        ? `${(
                            parseFloat(medicineForm.price) *
                            (1 - parseFloat(medicineForm.discount) / 100)
                          ).toFixed(4)} ETH`
                        : medicineForm.price
                        ? `${medicineForm.price} ETH`
                        : "0 ETH"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-gray-600 font-medium">
                    Total Value:
                  </span>
                  <span className="font-bold text-purple-600">
                    {medicineForm.price && medicineForm.quantity
                      ? `${(
                          parseFloat(medicineForm.price) *
                          parseInt(medicineForm.quantity) *
                          (1 - parseFloat(medicineForm.discount || 0) / 100)
                        ).toFixed(4)} ETH`
                      : "0 ETH"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Enhanced Quick Actions */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <FiActivity className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start border-2 border-purple-300 text-purple-700 hover:bg-purple-50 shadow-md transform hover:scale-105 transition-all duration-200"
                  onClick={() => router.push("/admin/medicines")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiPackage className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>View All Medicines</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 shadow-md transform hover:scale-105 transition-all duration-200"
                  onClick={() => router.push("/admin/dashboard")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FiBarChart className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span>Admin Dashboard</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-2 border-teal-300 text-teal-700 hover:bg-teal-50 shadow-md transform hover:scale-105 transition-all duration-200"
                  onClick={() => router.push("/admin/doctors")}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <MdLocalHospital className="h-4 w-4 text-teal-600" />
                    </div>
                    <span>Manage Doctors</span>
                  </div>
                </Button>
              </div>
            </div>
          </Card>

          {/* Enhanced Form Validation Status */}
          <Card
            className={`shadow-xl ${
              Object.keys(formErrors).length > 0
                ? "bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200"
                : "bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200"
            }`}
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 rounded-xl shadow-lg ${
                    Object.keys(formErrors).length > 0
                      ? "bg-gradient-to-r from-red-500 to-pink-500"
                      : "bg-gradient-to-r from-emerald-500 to-green-500"
                  }`}
                >
                  {Object.keys(formErrors).length > 0 ? (
                    <FiAlertCircle className="h-6 w-6 text-white" />
                  ) : (
                    <FiCheckCircle className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold mb-1 ${
                      Object.keys(formErrors).length > 0
                        ? "text-red-900"
                        : "text-emerald-900"
                    }`}
                  >
                    {Object.keys(formErrors).length > 0
                      ? "Form Has Errors"
                      : "Form Ready"}
                  </h3>
                  <p
                    className={`text-sm ${
                      Object.keys(formErrors).length > 0
                        ? "text-red-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {Object.keys(formErrors).length > 0
                      ? `${
                          Object.keys(formErrors).length
                        } field(s) need attention`
                      : "All required fields are properly filled"}
                  </p>
                </div>
              </div>
              {Object.keys(formErrors).length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-red-200 shadow-sm">
                  <h4 className="text-sm font-bold text-red-900 mb-2">
                    Issues to Fix:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Enhanced Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-white to-gray-50 border-t-2 border-gray-200 p-4 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Badge
              className={`text-sm px-4 py-2 border-none shadow-lg ${
                Object.keys(formErrors).length === 0
                  ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                {Object.keys(formErrors).length === 0 ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <FiAlertCircle className="w-4 h-4" />
                )}
                {Object.keys(formErrors).length === 0
                  ? "Form Valid"
                  : `${Object.keys(formErrors).length} Errors`}
              </div>
            </Badge>
            <div className="bg-white rounded-xl px-4 py-2 border-2 border-purple-200 shadow-md">
              <span className="text-sm font-bold text-purple-600 flex items-center gap-2">
                <FiDollarSign className="h-4 w-4" />
                Total Value:{" "}
                {medicineForm.price && medicineForm.quantity
                  ? `${(
                      parseFloat(medicineForm.price) *
                      parseInt(medicineForm.quantity) *
                      (1 - parseFloat(medicineForm.discount || 0) / 100)
                    ).toFixed(4)} ETH`
                  : "0 ETH"}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/medicines")}
              disabled={saving}
              className="border-2 border-gray-300 hover:bg-gray-50 shadow-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMedicine}
              loading={saving}
              disabled={
                saving || Object.keys(formErrors).length > 0 || !isConnected
              }
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg px-8"
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="small" color="white" />
                  <span>Adding Medicine...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FiSave className="h-4 w-4" />
                  <span>Add Medicine</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom spacer to account for fixed action bar */}
      <div className="h-24"></div>
    </div>
  );
};

export default AdminAddMedicine;
