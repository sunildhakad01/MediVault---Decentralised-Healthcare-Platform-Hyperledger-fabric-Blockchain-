import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import {
  FiShoppingBag,
  FiSearch,
  FiFilter,
  FiMapPin,
  FiDollarSign,
  FiPackage,
  FiPercent,
  FiShoppingCart,
  FiInfo,
  FiEye,
  FiHeart,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
} from "react-icons/fi";
import {
  MdLocalPharmacy,
  MdVerifiedUser,
  MdHealthAndSafety,
  MdMedicalServices,
  MdBiotech,
  MdSecurity,
  MdInventory,
  MdLocalShipping,
  MdDiscount,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdVaccines,
} from "react-icons/md";
import { FaPrescriptionBottle } from "react-icons/fa6";

import {
  FaPrescriptionBottleAlt,
  FaSyringe,
  FaPills,
  FaFlask,
  FaUserMd,
  FaHospitalUser,
  FaStethoscope,
  FaThermometerHalf,
  FaBandAid,
  FaVials,
  FaAllergies,
  FaNotesMedical,
  FaHeartbeat,
} from "react-icons/fa";
import { Card, Button, Input, Select, Badge, Modal } from "../common";
import LoadingSpinner from "../common/LoadingSpinner";
import { useHealthcareContract } from "../../hooks/useFabricAPI";
import { useAuth } from "../../context/AuthContext";
import ipfsService from "../../utils/ipfs";
import toast from "react-hot-toast";

const MedicineCard = ({
  medicine,
  onBuy,
  onViewDetails,
  userType,
  isPatient,
}) => {
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMedicineData = async () => {
      if (medicine.IPFS_URL) {
        try {
          const hash = medicine.IPFS_URL.replace(
            "https://gateway.pinata.cloud/ipfs/",
            ""
          );
          const data = await ipfsService.fetchFromIPFS(hash);
          setMedicineData(data);
        } catch (error) {
          console.error("Error fetching medicine data:", error);
        }
      }
    };

    fetchMedicineData();
  }, [medicine.IPFS_URL]);

  const discountedPrice =
    medicine.discount > 0
      ? (Number(medicine.price) * (100 - Number(medicine.discount))) / 100
      : Number(medicine.price);

  const formatPrice = (price) => {
    return `${(Number(price) / 1e18).toFixed(4)} ETH`;
  };

  const getMedicineIcon = () => {
    const medicineType = medicineData?.category?.toLowerCase() || "general";
    const icons = {
      tablet: FaPills,
      capsule: FaPrescriptionBottleAlt,
      injection: FaSyringe,
      syrup: FaFlask,
      ointment: FaBandAid,
      vaccine: MdVaccines,
      supplement: FaVials,
    };
    return icons[medicineType] || FaPrescriptionBottleAlt;
  };

  const MedicineIcon = getMedicineIcon();

  return (
    <Card className="hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-emerald-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-emerald-25">
      <div className="relative">
        {/* Enhanced Medicine Image Section */}
        <div className="h-48 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-t-lg flex items-center justify-center relative overflow-hidden">
          {medicineData?.medicineImage ? (
            <div className="relative w-full h-full">
              <img
                src={ipfsService.getIPFSUrl(medicineData.medicineImage)}
                alt={medicineData?.name || "Medicine"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg mb-2">
                <MedicineIcon className="h-12 w-12 text-white" />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                Medicine #{medicine.id}
              </span>
            </div>
          )}

          {/* Enhanced Status Badges */}
          <div className="absolute top-3 left-3">
            {medicine.active ? (
              <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-lg">
                <MdCheckCircle className="mr-1 h-3 w-3" />
                Available
              </Badge>
            ) : (
              <Badge className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-none shadow-lg">
                <MdCancel className="mr-1 h-3 w-3" />
                Out of Stock
              </Badge>
            )}
          </div>

          {medicine.discount > 0 && (
            <div className="absolute top-3 right-3">
              <Badge className="text-xs bg-gradient-to-r from-orange-500 to-yellow-500 text-white border-none shadow-lg animate-pulse">
                <MdDiscount className="mr-1 h-3 w-3" />
                {medicine.discount}% OFF
              </Badge>
            </div>
          )}

          {/* Verification Badge */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center space-x-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-3 py-1">
              <MdVerifiedUser className="h-3 w-3 text-emerald-600" />
              <span className="text-xs text-gray-700 font-medium">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Medicine Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">
              {medicineData?.name || `Medicine #${medicine.id}`}
            </h3>
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors transform hover:scale-110">
              <FiHeart className="h-5 w-5" />
            </button>
          </div>

          {medicineData?.manufacturer && (
            <div className="flex items-center mb-3">
              <MdBiotech className="h-4 w-4 text-teal-600 mr-2" />
              <p className="text-sm text-gray-600 font-medium">
                {medicineData.manufacturer}
              </p>
            </div>
          )}

          {medicineData?.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {medicineData.description}
            </p>
          )}

          {/* Enhanced Location */}
          <div className="flex items-center mb-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3">
            <MdLocalShipping className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800 font-medium">
              {medicine.currentLocation}
            </span>
          </div>

          {/* Enhanced Pricing */}
          <div className="mb-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              {medicine.discount > 0 ? (
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-emerald-600">
                    {formatPrice(discountedPrice)}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(medicine.price)}
                  </span>
                  <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200">
                    Save {medicine.discount}%
                  </Badge>
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(medicine.price)}
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Quantity and Dosage */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg px-3 py-2">
              <MdInventory className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-800 font-medium">
                {medicine.quantity} units
              </span>
            </div>
            {medicineData?.dosage && (
              <div className="bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 px-3 py-1 rounded-lg">
                <span className="text-xs font-medium">
                  {medicineData.dosage}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="small"
              onClick={() => onViewDetails(medicine)}
              className="flex-1 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-200"
            >
              <FiEye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            {isPatient && medicine.active && (
              <Button
                size="small"
                onClick={() => onBuy(medicine)}
                disabled={medicine.quantity === 0}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-200 transform hover:scale-105"
              >
                <FiShoppingCart className="h-4 w-4 mr-2" />
                Purchase Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const MedicineDetailsModal = ({ medicine, isOpen, onClose }) => {
  const [medicineData, setMedicineData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMedicineData = async () => {
      if (medicine?.IPFS_URL && isOpen) {
        try {
          setLoading(true);
          const hash = medicine.IPFS_URL.replace(
            "https://gateway.pinata.cloud/ipfs/",
            ""
          );
          const data = await ipfsService.fetchFromIPFS(hash);
          setMedicineData(data);
        } catch (error) {
          console.error("Error fetching medicine data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMedicineData();
  }, [medicine?.IPFS_URL, isOpen]);

  if (!medicine) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medicine Information"
      size="large"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-4">
              <MdLocalPharmacy className="h-8 w-8 text-white animate-pulse" />
            </div>
            <LoadingSpinner size="large" />
            <p className="text-gray-600 mt-4">Loading medicine details...</p>
          </div>
        ) : (
          <>
            {/* Enhanced Header Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-64 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {medicineData?.medicineImage ? (
                      <img
                        src={ipfsService.getIPFSUrl(medicineData.medicineImage)}
                        alt={medicineData?.name || "Medicine"}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                          <MdLocalPharmacy className="h-16 w-16 text-white" />
                        </div>
                        <span className="text-gray-600 font-medium mt-4">
                          Medicine #{medicine.id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      {medicineData?.name || `Medicine #${medicine.id}`}
                      <MdVerifiedUser className="h-6 w-6 text-emerald-600" />
                    </h2>
                    {medicineData?.manufacturer && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MdBiotech className="h-5 w-5" />
                        <span className="font-medium">
                          {medicineData.manufacturer}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-emerald-200">
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <FiDollarSign className="h-4 w-4" />
                        Price
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {(Number(medicine.price) / 1e18).toFixed(4)} ETH
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-teal-200">
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <MdInventory className="h-4 w-4" />
                        Available
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {medicine.quantity} units
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <MdDiscount className="h-4 w-4" />
                        Discount
                      </p>
                      <p className="text-xl font-bold text-orange-600">
                        {medicine.discount}%
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <MdHealthAndSafety className="h-4 w-4" />
                        Status
                      </p>
                      <Badge
                        variant={medicine.active ? "success" : "danger"}
                        className="text-sm"
                      >
                        {medicine.active ? "Available" : "Out of Stock"}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                      <MdLocalShipping className="h-4 w-4" />
                      Location
                    </p>
                    <p className="text-gray-900 font-medium">
                      {medicine.currentLocation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Detailed Information */}
            {medicineData && (
              <div className="space-y-6">
                {medicineData.description && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FaNotesMedical className="h-5 w-5 text-blue-600" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {medicineData.description}
                    </p>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {medicineData.dosage && (
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaPrescriptionBottleAlt className="h-4 w-4 text-purple-600" />
                        Dosage Information
                      </h4>
                      <p className="text-gray-700">{medicineData.dosage}</p>
                    </Card>
                  )}

                  {medicineData.sideEffects && (
                    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MdWarning className="h-4 w-4 text-yellow-600" />
                        Side Effects
                      </h4>
                      <p className="text-gray-700">
                        {medicineData.sideEffects}
                      </p>
                    </Card>
                  )}

                  {medicineData.contraindications && (
                    <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaAllergies className="h-4 w-4 text-red-600" />
                        Contraindications
                      </h4>
                      <p className="text-gray-700">
                        {medicineData.contraindications}
                      </p>
                    </Card>
                  )}

                  {medicineData.activeIngredient && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FaFlask className="h-4 w-4 text-green-600" />
                        Active Ingredient
                      </h4>
                      <p className="text-gray-700">
                        {medicineData.activeIngredient}
                      </p>
                    </Card>
                  )}
                </div>

                {medicineData.instructions && (
                  <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <FaPrescriptionBottle className="h-5 w-5 text-teal-600" />
                      Usage Instructions
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {medicineData.instructions}
                    </p>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

const PurchaseModal = ({ medicine, isOpen, onClose, onConfirm }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPrice = quantity * (Number(medicine?.price) || 0);
  const discountedPrice =
    medicine?.discount > 0
      ? (totalPrice * (100 - Number(medicine.discount))) / 100
      : totalPrice;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      await onConfirm(medicine, quantity, (discountedPrice / 1e18).toFixed(6));
      onClose();
    } catch (error) {
      console.error("Purchase error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!medicine) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase Medicine">
      <div className="space-y-6">
        {/* Enhanced Medicine Header */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <MdLocalPharmacy className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Medicine #{medicine.id}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MdLocalShipping className="h-4 w-4" />
                  <span>{medicine.currentLocation}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MdVerifiedUser className="h-4 w-4 text-emerald-600" />
                  <span>Verified Medicine</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quantity Selection */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <MdInventory className="h-4 w-4 text-blue-600" />
              Select Quantity
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center text-xl font-bold hover:border-emerald-300 transition-all"
                disabled={quantity <= 1}
              >
                -
              </button>
              <div className="w-20 h-12 border-2 border-emerald-300 rounded-xl bg-white flex items-center justify-center text-xl font-bold text-emerald-600">
                {quantity}
              </div>
              <button
                onClick={() =>
                  setQuantity(Math.min(medicine.quantity, quantity + 1))
                }
                className="w-12 h-12 border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center text-xl font-bold hover:border-emerald-300 transition-all"
                disabled={quantity >= medicine.quantity}
              >
                +
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 flex items-center justify-center gap-1">
              <MdInventory className="h-4 w-4" />
              {medicine.quantity} units available
            </p>
          </div>
        </Card>

        {/* Enhanced Price Breakdown */}
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <FiDollarSign className="h-4 w-4" />
              Price Breakdown
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unit Price:</span>
                <span className="text-gray-900 font-medium">
                  {(Number(medicine.price) / 1e18).toFixed(6)} ETH
                </span>
              </div>
              {medicine.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <MdDiscount className="h-4 w-4" />-{medicine.discount}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-medium">
                  {(totalPrice / 1e18).toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-3">
                <span className="flex items-center gap-2">
                  <MdHealthAndSafety className="h-5 w-5 text-emerald-600" />
                  Total Amount:
                </span>
                <span className="text-emerald-600 text-xl">
                  {(discountedPrice / 1e18).toFixed(6)} ETH
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-2 border-gray-300 hover:border-gray-400"
          >
            Cancel Purchase
          </Button>
          <Button
            onClick={handlePurchase}
            loading={loading}
            disabled={loading || quantity > medicine.quantity}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all"
          >
            {loading ? (
              <div className="flex items-center">
                <LoadingSpinner size="small" color="white" />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <FiShoppingCart className="mr-2 h-4 w-4" />
                Confirm Purchase
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [userType, setUserType] = useState(null);

  const { user: fabricUser } = useAuth();
  const isConnected = !!fabricUser;
  const address = fabricUser?.userId || fabricUser?.email || '';
  const router = useRouter();
  const { getAllMedicines, buyMedicine, getPatientId, getUserType } =
    useHealthcareContract();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch medicines
        const medicineList = await getAllMedicines();
        setMedicines(medicineList || []);
        setFilteredMedicines(medicineList || []);

        // Get user type if connected
        if (isConnected && address) {
          const userInfo = await getUserType(address);
          setUserType(userInfo);
        }
      } catch (error) {
        console.error("Error fetching medicines:", error);
        toast.error("Failed to load medicines");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isConnected, address]);

  useEffect(() => {
    let filtered = medicines;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (medicine) =>
          medicine.currentLocation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          medicine.id.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "available") {
        filtered = filtered.filter(
          (medicine) => medicine.active && medicine.quantity > 0
        );
      } else if (filterStatus === "out-of-stock") {
        filtered = filtered.filter(
          (medicine) => !medicine.active || medicine.quantity === 0
        );
      } else if (filterStatus === "discounted") {
        filtered = filtered.filter((medicine) => medicine.discount > 0);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return Number(a.price) - Number(b.price);
        case "price-high":
          return Number(b.price) - Number(a.price);
        case "discount":
          return Number(b.discount) - Number(a.discount);
        case "quantity":
          return Number(b.quantity) - Number(a.quantity);
        default:
          return Number(a.id) - Number(b.id);
      }
    });

    setFilteredMedicines(filtered);
  }, [medicines, searchTerm, filterStatus, sortBy]);

  const handleViewDetails = (medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailsModal(true);
  };

  const handleBuyMedicine = (medicine) => {
    if (!isConnected) {
      toast.error("Please connect your wallet to purchase medicines");
      return;
    }

    if (!userType || userType.userType !== "patient") {
      toast.error("Only registered patients can purchase medicines");
      return;
    }

    setSelectedMedicine(medicine);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async (medicine, quantity, totalPrice) => {
    try {
      const patientId = await getPatientId(address);
      if (!patientId) {
        toast.error(
          "Patient ID not found. Please register as a patient first."
        );
        return;
      }

      await buyMedicine(patientId, medicine.id, quantity, totalPrice);

      // Refresh medicines list
      const updatedMedicines = await getAllMedicines();
      setMedicines(updatedMedicines || []);

      toast.success("Medicine purchased successfully!");
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to purchase medicine");
    }
  };

  const isPatient = userType?.userType === "patient";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-2xl">
              <MdLocalPharmacy className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-300 rounded-full animate-ping"></div>
          </div>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading pharmacy...</p>
          <p className="text-sm text-gray-500">Fetching verified medicines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 relative">
      {/* Medical Background Elements */}
      <div className="absolute inset-0 opacity-5 overflow-hidden">
        <FaPrescriptionBottleAlt className="absolute top-20 right-20 h-32 w-32 text-emerald-600 animate-pulse" />
        <FaPills className="absolute bottom-20 left-20 h-24 w-24 text-teal-600" />
        <MdLocalPharmacy className="absolute top-1/2 left-1/4 h-28 w-28 text-cyan-600 animate-pulse animation-delay-2000" />
      </div>

      {/* Enhanced Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl shadow-2xl">
              <MdLocalPharmacy className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-300 rounded-full border-4 border-white">
              <MdVerifiedUser className="h-4 w-4 text-emerald-700 m-1" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-teal-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          Medical Pharmacy
          <MdMedicalServices className="h-8 w-8 text-emerald-600" />
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Browse and purchase verified medicines on our secure
          blockchain-powered healthcare marketplace
        </p>
        <div className="mt-4 flex items-center justify-center space-x-6 text-emerald-600">
          <div className="flex items-center space-x-2">
            <MdHealthAndSafety className="h-5 w-5" />
            <span className="text-sm font-medium">FDA Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <MdBiotech className="h-5 w-5" />
            <span className="text-sm font-medium">Blockchain Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiTruck className="h-5 w-5" />
            <span className="text-sm font-medium">Fast Delivery</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="mb-8 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search medicines by location, ID, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Medicines</option>
            <option value="available">Available Now</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="discounted">Special Offers</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="name">Sort by ID</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="discount">Best Discounts</option>
            <option value="quantity">Most Available</option>
          </Select>
        </div>
      </Card>

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdLocalPharmacy className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-blue-600">
            {medicines.length}
          </h3>
          <p className="text-blue-800 font-medium">Total Medicines</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdCheckCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-green-600">
            {medicines.filter((m) => m.active && m.quantity > 0).length}
          </h3>
          <p className="text-green-800 font-medium">Available Now</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdDiscount className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-orange-600">
            {medicines.filter((m) => m.discount > 0).length}
          </h3>
          <p className="text-orange-800 font-medium">Special Offers</p>
        </Card>
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-all">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl w-fit mx-auto mb-3 shadow-lg">
            <MdInventory className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-purple-600">
            {medicines.reduce((sum, m) => sum + Number(m.quantity), 0)}
          </h3>
          <p className="text-purple-800 font-medium">Total Units</p>
        </Card>
      </div>

      {/* Enhanced User Status Alerts */}
      {!isConnected && (
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg">
              <MdSecurity className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                Connect Wallet to Purchase
              </h3>
              <p className="text-yellow-800 leading-relaxed">
                Connect your Web3 wallet and register as a patient to purchase
                verified medicines from our blockchain-secured pharmacy
                marketplace.
              </p>
              <div className="mt-3 flex items-center space-x-4">
                <Button
                  size="small"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  Connect Wallet
                </Button>
                <div className="flex items-center space-x-1 text-sm text-yellow-700">
                  <FiShield className="h-4 w-4" />
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {isConnected && !isPatient && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <FaHospitalUser className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                Patient Registration Required
                <MdHealthAndSafety className="h-5 w-5" />
              </h3>
              <p className="text-blue-800 leading-relaxed mb-4">
                Register as a patient on our healthcare platform to purchase
                medicines, access medical consultations, and manage your health
                records securely.
              </p>
              <Button
                size="small"
                onClick={() => router.push("/patient/register")}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                <FaHospitalUser className="mr-2 h-4 w-4" />
                Register as Patient
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Medicine Grid */}
      {filteredMedicines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {filteredMedicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onBuy={handleBuyMedicine}
              onViewDetails={handleViewDetails}
              userType={userType}
              isPatient={isPatient}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200">
          <div className="p-6 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full w-fit mx-auto mb-6">
            <MdLocalPharmacy className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            No medicines found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search criteria or filters to find the medicines you need."
              : "No medicines are currently available in our pharmacy marketplace. Please check back later."}
          </p>
          {(searchTerm || filterStatus !== "all") && (
            <div className="mt-4 space-x-3">
              <Button
                variant="outline"
                size="small"
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setSortBy("name");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Enhanced Modals */}
      <MedicineDetailsModal
        medicine={selectedMedicine}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      <PurchaseModal
        medicine={selectedMedicine}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
};

export default MedicineList;
