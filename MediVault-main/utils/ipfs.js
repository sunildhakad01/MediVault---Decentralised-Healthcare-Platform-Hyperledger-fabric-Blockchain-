const PINATA_JWT     = process.env.NEXT_PUBLIC_PINATA_JWT     || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

class IPFSService {
  constructor() {
    this.pinataJWT = PINATA_JWT;
    this.gateway   = PINATA_GATEWAY;
  }

  async uploadToIPFS(file, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: {
          type: metadata.type || "healthcare-file",
          uploadedAt: new Date().toISOString(),
          ...metadata.keyvalues,
        },
      });

      formData.append("pinataMetadata", pinataMetadata);

      formData.append(
        "pinataOptions",
        JSON.stringify({
          cidVersion: 1,
        })
      );

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.pinataJWT}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        hash: result.IpfsHash,
        url: `${this.gateway}/ipfs/${result.IpfsHash}`,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
      };
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  async uploadJSONToIPFS(jsonData, metadata = {}) {
    try {
      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.pinataJWT}`,
          },
          body: JSON.stringify({
            pinataContent: jsonData,
            pinataMetadata: {
              name: metadata.name || "healthcare-metadata",
              keyvalues: {
                type: metadata.type || "healthcare-json",
                uploadedAt: new Date().toISOString(),
                ...metadata.keyvalues,
              },
            },
            pinataOptions: {
              cidVersion: 1,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        hash: result.IpfsHash,
        url: `${this.gateway}/ipfs/${result.IpfsHash}`,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
      };
    } catch (error) {
      console.error("Error uploading JSON to IPFS:", error);
      throw error;
    }
  }

  async fetchFromIPFS(hash) {
    try {
      const response = await fetch(`${this.gateway}/ipfs/${hash}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching from IPFS:", error);
      throw error;
    }
  }

  async uploadDoctorProfile(profileData, profileImage) {
    try {
      let imageHash = null;
      if (profileImage) {
        const imageResult = await this.uploadToIPFS(profileImage, {
          name: `doctor-profile-${Date.now()}`,
          type: "doctor-profile-image",
        });
        imageHash = imageResult.hash;
      }

      const metadata = {
        ...profileData,
        profileImage: imageHash,
        timestamp: new Date().toISOString(),
        type: "doctor-profile",
      };

      const metadataResult = await this.uploadJSONToIPFS(metadata, {
        name: `doctor-metadata-${profileData.name || "unknown"}`,
        type: "doctor-metadata",
      });

      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        imageHash,
        imageUrl: imageHash ? `${this.gateway}/ipfs/${imageHash}` : null,
      };
    } catch (error) {
      console.error("Error uploading doctor profile:", error);
      throw error;
    }
  }

  async uploadPatientProfile(profileData, profileImage) {
    try {
      let imageHash = null;
      if (profileImage) {
        const imageResult = await this.uploadToIPFS(profileImage, {
          name: `patient-profile-${Date.now()}`,
          type: "patient-profile-image",
        });
        imageHash = imageResult.hash;
      }

      const metadata = {
        ...profileData,
        profileImage: imageHash,
        timestamp: new Date().toISOString(),
        type: "patient-profile",
      };

      const metadataResult = await this.uploadJSONToIPFS(metadata, {
        name: `patient-metadata-${profileData.name || "unknown"}`,
        type: "patient-metadata",
      });

      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        imageHash,
        imageUrl: imageHash ? `${this.gateway}/ipfs/${imageHash}` : null,
      };
    } catch (error) {
      console.error("Error uploading patient profile:", error);
      throw error;
    }
  }

  async uploadMedicineData(medicineData, medicineImage) {
    try {
      let imageHash = null;
      if (medicineImage) {
        const imageResult = await this.uploadToIPFS(medicineImage, {
          name: `medicine-image-${Date.now()}`,
          type: "medicine-image",
        });
        imageHash = imageResult.hash;
      }

      const metadata = {
        ...medicineData,
        medicineImage: imageHash,
        timestamp: new Date().toISOString(),
        type: "medicine-data",
      };

      const metadataResult = await this.uploadJSONToIPFS(metadata, {
        name: `medicine-metadata-${medicineData.name || "unknown"}`,
        type: "medicine-metadata",
      });

      return {
        metadataHash: metadataResult.hash,
        metadataUrl: metadataResult.url,
        imageHash,
        imageUrl: imageHash ? `${this.gateway}/ipfs/${imageHash}` : null,
      };
    } catch (error) {
      console.error("Error uploading medicine data:", error);
      throw error;
    }
  }

  getIPFSUrl(hash) {
    return `${this.gateway}/ipfs/${hash}`;
  }
}

export const ipfsService = new IPFSService();
export default ipfsService;
