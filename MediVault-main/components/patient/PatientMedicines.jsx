import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiHeart,
  FiMapPin,
  FiDollarSign,
  FiPackage,
  FiTag,
  FiInfo,
  FiStar,
  FiUser,
  FiClock,
  FiTruck,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiFileText,
  FiEye,
  FiShield,
  FiArrowLeft,
} from "react-icons/fi";
import { CiPill } from "react-icons/ci";
import {
  MdLocalPharmacy,
  MdVerifiedUser,
  MdDiscount,
  MdHealthAndSafety,
  MdMedicalServices,
  MdBiotech,
  MdSecurity,
  MdPayment,
  MdLocalHospital,
  MdEmergency,
  MdFavorite,
  MdInventory,
} from "react-icons/md";
import {
  FaPrescriptionBottleAlt,
  FaStethoscope,
  FaPills,
  FaUserMd,
  FaHospitalUser,
  FaNotesMedical,
} from "react-icons/fa";
import { Card, Button, Input, Select, Badge } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import { useAuth } from "../../context/AuthContext";
import ipfsService from "../../utils/ipfs";
import { truncateAddress, safeNumberConversion } from "../../utils/helpers";
import toast from "react-hot-toast";

const MedicineCard = ({ medicine, onPurchase, onViewDetails, patientId }) => {
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchMedicineData = async () => {
      if (medicine.IPFS_URL) {
        try {
          setLoading(true);
          let hash = medicine.IPFS_URL;
          if (hash.includes("/ipfs/")) {
            hash = hash.split("/ipfs/")[1];
          }
          console.log("Fetching medicine data for hash:", hash);
          const data = await ipfsService.fetchFromIPFS(hash);
          console.log("Medicine data fetched:", data);
          setMedicineData(data);
        } catch (error) {
          console.error("Error fetching medicine data:", error);
          // Set fallback data if IPFS fails
          setMedicineData({
            name: `Medicine #${safeNumberConversion(medicine.id)}`,
            description: "Medicine details unavailable",
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Set fallback data if no IPFS URL
        setMedicineData({
          name: `Medicine #${safeNumberConversion(medicine.id)}`,
          description: "Medicine details unavailable",
        });
      }
    };

    fetchMedicineData();
  }, [medicine.IPFS_URL, medicine.id]);

  const formatPrice = (price) => {
    try {
      if (!price) return 0;
      return parseFloat(price || 0);
    } catch (error) {
      console.error("Error formatting price:", error);
      return 0;
    }
  };

  const price = formatPrice(medicine.price);
  const discount = safeNumberConversion(medicine.discount) || 0;
  const discountedPrice = price * (1 - discount / 100);
  const totalPrice = discountedPrice * quantity;
  const isAvailable =
    medicine.active && safeNumberConversion(medicine.quantity) > 0;
  const maxQuantity = safeNumberConversion(medicine.quantity);

  const handlePurchase = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("Purchase clicked:", {
      medicineId: safeNumberConversion(medicine.id),
      quantity,
      totalPrice,
      patientId,
      isAvailable,
    });

    if (!isAvailable || quantity > maxQuantity) {
      toast.error("Insufficient stock available");
      return;
    }

    if (quantity <= 0) {
      toast.error("Please select a valid quantity");
      return;
    }

    try {
      setPurchasing(true);
      await onPurchase(safeNumberConversion(medicine.id), quantity, totalPrice);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = Math.min(
      Math.max(1, Number(e.target.value) || 1),
      maxQuantity
    );
    setQuantity(newQuantity);
  };

  return (
    <div
      className={`transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
        !isAvailable ? "opacity-75" : ""
      } bg-gradient-to-br from-white to-gray-25 border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-teal-300`}
    >
      <div className="p-6">
        {/* Medicine Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-teal-200 shadow-lg">
            {loading ? (
              <LoadingSpinner size="small" />
            ) : medicineData?.medicineImage ? (
              <img
                src={ipfsService.getIPFSUrl(medicineData.medicineImage)}
                alt={medicineData?.name || "Medicine"}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    medicineData.medicineImage
                  );
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML =
                    '<div class="h-8 w-8 text-teal-600"><svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                }}
              />
            ) : medicineData?.images && medicineData.images.length > 0 ? (
              <img
                src={ipfsService.getIPFSUrl(medicineData.images[0])}
                alt={medicineData?.name || "Medicine"}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    medicineData.images[0]
                  );
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML =
                    '<div class="h-8 w-8 text-teal-600"><svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>';
                }}
              />
            ) : (
              <FaPrescriptionBottleAlt className="h-8 w-8 text-teal-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                {medicineData?.name ||
                  `Medicine #${safeNumberConversion(medicine.id)}`}
              </h3>
              <div className="flex items-center space-x-2">
                {discount > 0 && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-none text-xs">
                    <MdDiscount className="w-3 h-3 mr-1" />
                    {discount}% OFF
                  </Badge>
                )}
                <Badge
                  className={
                    isAvailable
                      ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none text-xs"
                      : "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-none text-xs"
                  }
                >
                  <MdInventory className="w-3 h-3 mr-1" />
                  {isAvailable ? "Available" : "Out of Stock"}
                </Badge>
              </div>
            </div>

            {medicineData?.category && (
              <div className="flex items-center space-x-2 mb-2">
                <MdMedicalServices className="h-4 w-4 text-teal-600" />
                <p className="text-sm text-gray-600 capitalize font-medium">
                  {medicineData.category}
                </p>
              </div>
            )}

            {medicineData?.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {medicineData.description}
              </p>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center bg-white rounded-lg px-3 py-1 border border-blue-200">
                <FiMapPin className="h-4 w-4 mr-1 text-blue-600" />
                <span className="font-medium">
                  {medicine.currentLocation || "N/A"}
                </span>
              </div>
              <div className="flex items-center bg-white rounded-lg px-3 py-1 border border-teal-200">
                <FiPackage className="h-4 w-4 mr-1 text-teal-600" />
                <span className="font-medium">{maxQuantity} in stock</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
          <div className="flex items-center space-x-2">
            <MdPayment className="h-5 w-5 text-teal-600" />
            {discount > 0 ? (
              <div className="flex items-center space-x-3">
                <span className="text-xl font-bold text-teal-700">
                  {discountedPrice.toFixed(4)} ETH
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {price.toFixed(4)} ETH
                </span>
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-none text-xs">
                  Save {(price - discountedPrice).toFixed(4)} ETH
                </Badge>
              </div>
            ) : (
              <span className="text-xl font-bold text-teal-700">
                {price.toFixed(4)} ETH
              </span>
            )}
          </div>
        </div>

        {/* Medicine Details Toggle */}
        <div className="mb-4">
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <FiInfo className="h-4 w-4 mr-2" />
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
        </div>

        {/* Expandable Details */}
        {showDetails && medicineData && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3 text-sm">
            {medicineData.manufacturer && (
              <div className="flex items-start space-x-2">
                <MdBiotech className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-bold text-blue-900">
                    Manufacturer:{" "}
                  </span>
                  <span className="text-blue-800">
                    {medicineData.manufacturer}
                  </span>
                </div>
              </div>
            )}
            {medicineData.activeIngredient && (
              <div className="flex items-start space-x-2">
                <FaPills className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900">
                    Active Ingredient:{" "}
                  </span>
                  <span className="text-indigo-800">
                    {medicineData.activeIngredient}
                  </span>
                </div>
              </div>
            )}
            {medicineData.dosage && (
              <div className="flex items-start space-x-2">
                <FaNotesMedical className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <span className="font-bold text-purple-900">Dosage: </span>
                  <span className="text-purple-800">{medicineData.dosage}</span>
                </div>
              </div>
            )}
            {medicineData.sideEffects && (
              <div className="flex items-start space-x-2">
                <MdEmergency className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <span className="font-bold text-orange-900">
                    Side Effects:{" "}
                  </span>
                  <span className="text-orange-800">
                    {medicineData.sideEffects}
                  </span>
                </div>
              </div>
            )}
            {medicineData.expiryDate && (
              <div className="flex items-start space-x-2">
                <FiClock className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <span className="font-bold text-red-900">Expiry: </span>
                  <span className="text-red-800">
                    {medicineData.expiryDate}
                  </span>
                </div>
              </div>
            )}
            {medicineData.instructions && (
              <div className="flex items-start space-x-2">
                <FiFileText className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <span className="font-bold text-green-900">
                    Instructions:{" "}
                  </span>
                  <span className="text-green-800">
                    {medicineData.instructions}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Purchase Section */}
        {isAvailable ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 bg-white rounded-xl p-4 border-2 border-teal-200">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                  <MdInventory className="h-4 w-4 text-teal-600" />
                  Quantity
                </label>
                <Input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-full focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium flex items-center gap-1">
                  <MdPayment className="h-4 w-4" />
                  Total
                </p>
                <p className="text-xl font-bold text-teal-600">
                  {totalPrice.toFixed(4)} ETH
                </p>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              loading={purchasing}
              disabled={purchasing || quantity === 0 || !patientId}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              {purchasing ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="small" color="white" />
                  <span className="ml-3">Processing Purchase...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FiShoppingCart className="h-5 w-5 mr-3" />
                  Buy Now ({totalPrice.toFixed(4)} ETH)
                  <MdVerifiedUser className="h-5 w-5 ml-3" />
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
            <MdInventory className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3 font-medium">
              Currently unavailable
            </p>
            <Button
              variant="outline"
              disabled
              className="w-full border-2 border-gray-300 text-gray-500"
            >
              <FiX className="h-4 w-4 mr-2" />
              Out of Stock
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const PrescriptionCard = ({ prescription, medicines, onViewMedicine }) => {
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const medicine = medicines.find(
    (m) =>
      safeNumberConversion(m.id) ===
      safeNumberConversion(prescription.medicineId)
  );

  useEffect(() => {
    const fetchPrescriptionData = async () => {
      if (medicine?.IPFS_URL) {
        try {
          setLoading(true);
          let hash = medicine.IPFS_URL;
          if (hash.includes("/ipfs/")) {
            hash = hash.split("/ipfs/")[1];
          }
          const data = await ipfsService.fetchFromIPFS(hash);
          setPrescriptionData(data);
        } catch (error) {
          console.error("Error fetching prescription data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPrescriptionData();
  }, [medicine?.IPFS_URL]);

  const formatDate = (timestamp) => {
    try {
      const date = new Date(safeNumberConversion(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center border-2 border-blue-200 shadow-lg">
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <FaPrescriptionBottleAlt className="h-8 w-8 text-blue-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900 text-lg">
                {prescriptionData?.name ||
                  `Medicine #${safeNumberConversion(prescription.medicineId)}`}
              </h4>
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
                <FaNotesMedical className="w-3 h-3 mr-1" />
                Prescribed
              </Badge>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <FaUserMd className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-gray-600 font-medium">
                Prescribed by Doctor #
                {safeNumberConversion(prescription.doctorId)}
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center space-x-2">
                  <FiFileText className="h-3 w-3 text-indigo-600" />
                  <span className="text-gray-600">
                    Prescription ID: #{safeNumberConversion(prescription.id)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="h-3 w-3 text-blue-600" />
                  <span className="text-gray-600">
                    Date: {formatDate(prescription.date)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="small"
            onClick={() =>
              onViewMedicine(safeNumberConversion(prescription.medicineId))
            }
            className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <FiEye className="h-4 w-4 mr-2" />
            View Medicine
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order, medicines }) => {
  const medicine = medicines.find(
    (m) => safeNumberConversion(m.id) === safeNumberConversion(order.medicineId)
  );

  const formatDate = (timestamp) => {
    try {
      const date = new Date(safeNumberConversion(timestamp) * 1000);
      return date.toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  const formatPrice = (price) => {
    try {
      if (!price) return "0";
      return parseFloat(price || 0).toFixed(4);
    } catch {
      return "0";
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl flex items-center justify-center border-2 border-emerald-200 shadow-lg">
              <FiTruck className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                Medicine #{safeNumberConversion(order.medicineId)}
              </h4>
              <p className="text-gray-600 font-medium mb-3">
                {medicine
                  ? `${medicine.name || "Medicine"}`
                  : "Medicine details unavailable"}
              </p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                  <div className="p-1 bg-blue-100 rounded-lg w-fit mx-auto mb-1">
                    <FiPackage className="h-3 w-3 text-blue-600" />
                  </div>
                  <p className="font-bold text-blue-600">
                    {safeNumberConversion(order.quantity)}
                  </p>
                  <p className="text-xs text-gray-600">Quantity</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                  <div className="p-1 bg-teal-100 rounded-lg w-fit mx-auto mb-1">
                    <MdPayment className="h-3 w-3 text-teal-600" />
                  </div>
                  <p className="font-bold text-teal-600">
                    {formatPrice(order.payAmount)} ETH
                  </p>
                  <p className="text-xs text-gray-600">Amount</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                  <div className="p-1 bg-purple-100 rounded-lg w-fit mx-auto mb-1">
                    <FiClock className="h-3 w-3 text-purple-600" />
                  </div>
                  <p className="font-bold text-purple-600">
                    {formatDate(order.date)}
                  </p>
                  <p className="text-xs text-gray-600">Date</p>
                </div>
              </div>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-none">
            <FiCheck className="w-4 h-4 mr-1" />
            Delivered
          </Badge>
        </div>
      </div>
    </div>
  );
};

const PatientMedicines = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();
  const {
    getAllMedicines,
    getPatientId,
    getPatientDetails,
    getPatientOrders,
    buyMedicine,
    getUserType,
  } = useHealthcareContract();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get medicines first (this should work without user validation)
        const allMedicines = await getAllMedicines();
        console.log("Medicines loaded:", allMedicines);
        setMedicines(allMedicines || []);

        // Only fetch patient-specific data if wallet is connected
        if (isConnected && address) {
          try {
            // Check if user is a patient
            const userInfo = await getUserType(address);
            console.log("User info:", userInfo);

            if (userInfo && userInfo.userType === "patient") {
              // Get patient data
              const patientId = await getPatientId(address);
              console.log("Patient ID:", patientId);

              if (patientId) {
                const [patientDetails, patientPrescriptions, patientOrders] =
                  await Promise.all([
                    getPatientDetails(patientId),
                    getPatientPrescriptions(patientId),
                    getPatientOrders(patientId),
                  ]);

                console.log("Patient data loaded:", {
                  patientDetails,
                  prescriptionsCount: patientPrescriptions?.length,
                  ordersCount: patientOrders?.length,
                });

                setPatientData({
                  ...patientDetails,
                  id: patientId,
                });
                setPrescriptions(patientPrescriptions || []);
                setOrders(patientOrders || []);
              } else {
                console.warn("Patient ID not found");
                toast.error("Patient not found. Please register first.");
              }
            } else {
              console.warn("User is not a patient");
              toast.error("Please register as a patient first");
            }
          } catch (error) {
            console.error("Error fetching patient data:", error);
            toast.error("Failed to load patient data");
          }
        } else {
          console.log("Wallet not connected - showing medicines only");
          toast.info("Connect your wallet to view prescriptions and orders");
        }
      } catch (error) {
        console.error("Error fetching medicines data:", error);
        toast.error("Failed to load medicines data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isConnected, address]);

  const handlePurchaseMedicine = async (medicineId, quantity, totalPrice) => {
    if (!patientData) {
      toast.error(
        "Please connect wallet and ensure you're registered as a patient"
      );
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet to purchase medicines");
      return;
    }

    console.log("Purchasing medicine:", {
      patientId: safeNumberConversion(patientData.id),
      medicineId,
      quantity,
      totalPrice,
    });

    try {
      await buyMedicine(
        safeNumberConversion(patientData.id),
        medicineId,
        quantity,
        totalPrice
      );

      toast.success("Medicine purchased successfully!");

      // Refresh data after purchase
      const [updatedMedicines, updatedOrders] = await Promise.all([
        getAllMedicines(),
        getPatientOrders(safeNumberConversion(patientData.id)),
      ]);

      setMedicines(updatedMedicines || []);
      setOrders(updatedOrders || []);
    } catch (error) {
      console.error("Error purchasing medicine:", error);

      if (error?.message?.includes("insufficient funds")) {
        toast.error("Insufficient ETH balance for purchase");
      } else if (error?.message?.includes("Not enough medicine in stock")) {
        toast.error("Insufficient stock available");
      } else if (error?.message?.includes("Medicine is not active")) {
        toast.error("This medicine is currently unavailable");
      } else if (
        error?.message?.includes("Only the patient can buy their medicine")
      ) {
        toast.error("Only the patient can purchase their own medicine");
      } else if (error?.message?.includes("user rejected")) {
        toast.error("Transaction was rejected by user");
      } else {
        toast.error(
          `Purchase failed: ${
            error?.shortMessage || error?.message || "Unknown error"
          }`
        );
      }
      throw error;
    }
  };

  const handleViewMedicine = (medicineId) => {
    // Scroll to medicine in browse tab
    setActiveTab("browse");
    setTimeout(() => {
      const element = document.getElementById(`medicine-${medicineId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Filter medicines based on search and filters
  const filteredMedicines = medicines.filter((medicine) => {
    const medicineId = safeNumberConversion(medicine.id).toString();
    const location = (medicine.currentLocation || "").toLowerCase();

    const matchesSearch =
      !searchTerm ||
      medicineId.includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase());

    const isAvailable =
      medicine.active && safeNumberConversion(medicine.quantity) > 0;
    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && isAvailable) ||
      (availabilityFilter === "out-of-stock" && !isAvailable);

    const formatPrice = (price) => {
      try {
        return parseFloat(price || 0 || 0);
      } catch {
        return 0;
      }
    };

    const price = formatPrice(medicine.price);
    const matchesPrice =
      !priceFilter ||
      (priceFilter === "low" && price < 0.01) ||
      (priceFilter === "medium" && price >= 0.01 && price < 0.1) ||
      (priceFilter === "high" && price >= 0.1);

    return matchesSearch && matchesAvailability && matchesPrice;
  });

  const tabs = [
    {
      id: "browse",
      label: "Browse Medicines",
      icon: MdLocalPharmacy,
      count: filteredMedicines.length,
    },
    {
      id: "prescriptions",
      label: "My Prescriptions",
      icon: FaPrescriptionBottleAlt,
      count: prescriptions.length,
    },
    {
      id: "orders",
      label: "Order History",
      icon: FiTruck,
      count: orders.length,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl">
              <MdLocalPharmacy className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading medicines...</p>
          <p className="text-sm text-gray-500">
            Connecting to pharmacy network
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <MdLocalPharmacy className="absolute top-20 right-20 h-32 w-32 text-teal-600 animate-pulse" />
        <FaPrescriptionBottleAlt className="absolute bottom-20 left-20 h-24 w-24 text-cyan-600" />
        <FaPills className="absolute top-1/2 left-1/4 h-28 w-28 text-blue-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="mb-12 relative z-10">
        <div className="flex items-center space-x-6 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/patient/dashboard")}
            className="border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            <FiArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
              <MdLocalPharmacy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                Healthcare Pharmacy
                <FaPrescriptionBottleAlt className="h-8 w-8 text-teal-600" />
              </h1>
              <p className="text-xl text-gray-600">
                Browse medicines, view prescriptions, and manage your healthcare
                orders
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status Cards */}
        {!isConnected ? (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                <FiInfo className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  Wallet Connection Required
                </h3>
                <p className="text-yellow-800 leading-relaxed">
                  Connect your Web3 wallet to view prescriptions, track orders,
                  and purchase medicines securely.
                </p>
                <div className="mt-3 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-yellow-700">
                    <FiShield className="h-4 w-4" />
                    <span className="font-medium">Secure Payments</span>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-700">
                    <MdHealthAndSafety className="h-4 w-4" />
                    <span className="font-medium">Patient Verification</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : !patientData ? null : (
          <Card className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                <MdVerifiedUser className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">
                  Patient Account Active
                </h3>
                <p className="text-emerald-800 leading-relaxed mb-3">
                  Your healthcare account is verified and ready for secure
                  medicine purchases.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                    <div className="p-1 bg-blue-100 rounded-lg w-fit mx-auto mb-1">
                      <FiUser className="h-3 w-3 text-blue-600" />
                    </div>
                    <p className="font-bold text-blue-600">
                      #{safeNumberConversion(patientData.id)}
                    </p>
                    <p className="text-xs text-gray-600">Patient ID</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                    <div className="p-1 bg-indigo-100 rounded-lg w-fit mx-auto mb-1">
                      <FaPrescriptionBottleAlt className="h-3 w-3 text-indigo-600" />
                    </div>
                    <p className="font-bold text-indigo-600">
                      {prescriptions.length}
                    </p>
                    <p className="text-xs text-gray-600">Prescriptions</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200 text-center">
                    <div className="p-1 bg-teal-100 rounded-lg w-fit mx-auto mb-1">
                      <FiTruck className="h-3 w-3 text-teal-600" />
                    </div>
                    <p className="font-bold text-teal-600">{orders.length}</p>
                    <p className="text-xs text-gray-600">Orders</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-2 border-2 border-gray-200">
          <nav className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 font-bold text-sm flex items-center justify-center space-x-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-md"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge
                      className={
                        activeTab === tab.id
                          ? "bg-white text-teal-600 border-none text-xs"
                          : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-none text-xs"
                      }
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Browse Medicines Tab */}
      {activeTab === "browse" && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              Browse Available Medicines
              <MdLocalPharmacy className="h-8 w-8 text-teal-600" />
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover verified pharmaceutical products from licensed healthcare
              providers
            </p>
          </div>

          {/* Enhanced Filters */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiFilter className="h-6 w-6 text-blue-600" />
                Search & Filter Medicines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                    <FiSearch className="h-4 w-4 text-blue-600" />
                    Search Medicines
                  </label>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by ID or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                    <MdPayment className="h-4 w-4 text-blue-600" />
                    Price Range
                  </label>
                  <Select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
                  >
                    <option value="">All Prices</option>
                    <option value="low">Low (&lt;0.01 ETH)</option>
                    <option value="medium">Medium (0.01 - 0.1 ETH)</option>
                    <option value="high">High (&gt;0.1 ETH)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-1">
                    <MdInventory className="h-4 w-4 text-blue-600" />
                    Availability
                  </label>
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 border-2 border-blue-200"
                  >
                    <option value="all">All Medicines</option>
                    <option value="available">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("");
                      setPriceFilter("");
                      setAvailabilityFilter("all");
                    }}
                    className="w-full border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <FiRefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
            <p className="text-gray-600 font-medium flex items-center gap-2">
              <MdInventory className="h-5 w-5 text-teal-600" />
              Showing{" "}
              <span className="font-bold text-teal-600">
                {filteredMedicines.length}
              </span>{" "}
              of <span className="font-bold">{medicines.length}</span> medicines
            </p>
            {!isConnected && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none">
                <FiShield className="w-3 h-3 mr-1" />
                Connect wallet to purchase
              </Badge>
            )}
          </div>

          {/* Medicines Grid */}
          {filteredMedicines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {filteredMedicines.map((medicine) => (
                <div
                  key={safeNumberConversion(medicine.id)}
                  id={`medicine-${safeNumberConversion(medicine.id)}`}
                >
                  <MedicineCard
                    medicine={medicine}
                    onPurchase={handlePurchaseMedicine}
                    patientId={patientData?.id}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200">
              <div className="p-6 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full w-fit mx-auto mb-6">
                <MdLocalPharmacy className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No medicines found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {searchTerm || priceFilter || availabilityFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "There are currently no medicines available in our pharmacy network."}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              Your Medical Prescriptions
              <FaPrescriptionBottleAlt className="h-8 w-8 text-blue-600" />
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              View medicines prescribed by your healthcare providers
            </p>
          </div>

          {!isConnected ? (
            <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-fit mx-auto mb-6">
                <FiUser className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Please connect your Web3 wallet to securely access your medical
                prescriptions.
              </p>
              <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-blue-600">
                  <FiShield className="h-4 w-4" />
                  <span className="font-medium">HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-1 text-indigo-600">
                  <MdSecurity className="h-4 w-4" />
                  <span className="font-medium">Blockchain Secured</span>
                </div>
              </div>
            </Card>
          ) : !patientData ? (
            <Card className="text-center py-16 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
              <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto mb-6">
                <FaHospitalUser className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Patient Registration Required
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
                Register as a patient to access your medical prescriptions and
                healthcare records.
              </p>
              <Button
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register Now
              </Button>
            </Card>
          ) : prescriptions.length > 0 ? (
            <div className="space-y-6">
              {prescriptions.map((prescription) => (
                <PrescriptionCard
                  key={safeNumberConversion(prescription.id)}
                  prescription={prescription}
                  medicines={medicines}
                  onViewMedicine={handleViewMedicine}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-fit mx-auto mb-6">
                <FaPrescriptionBottleAlt className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No prescriptions yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
                Your prescribed medicines from doctor consultations will appear
                here.
              </p>
              <Button
                onClick={() => router.push("/patient/book-appointment")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <FaStethoscope className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              Your Order History
              <FiTruck className="h-8 w-8 text-emerald-600" />
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Track your medicine purchases and delivery history
            </p>
          </div>

          {!isConnected ? (
            <Card className="text-center py-16 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full w-fit mx-auto mb-6">
                <FiUser className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Please connect your Web3 wallet to view your medicine order
                history.
              </p>
            </Card>
          ) : !patientData ? (
            <Card className="text-center py-16 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200">
              <div className="p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full w-fit mx-auto mb-6">
                <FaHospitalUser className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Patient Registration Required
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
                Register as a patient to view your order history and track
                purchases.
              </p>
              <Button
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register Now
              </Button>
            </Card>
          ) : orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order, index) => (
                <OrderCard key={index} order={order} medicines={medicines} />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
              <div className="p-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full w-fit mx-auto mb-6">
                <FiTruck className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No orders yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
                Your medicine orders and delivery history will appear here after
                purchases.
              </p>
              <Button
                onClick={() => setActiveTab("browse")}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <MdLocalPharmacy className="mr-2 h-4 w-4" />
                Browse Medicines
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientMedicines;
