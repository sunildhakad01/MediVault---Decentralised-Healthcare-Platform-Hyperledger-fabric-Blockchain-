package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ─── Data Models ──────────────────────────────────────────────────────────────

type Doctor struct {
	DoctorID       string    `json:"doctorID"`
	UserID         string    `json:"userID"`
	IPFSURL        string    `json:"ipfsURL"`
	Name           string    `json:"name"`
	Specialization string    `json:"specialization"`
	Hospital       string    `json:"hospital"`
	LicenseNumber  string    `json:"licenseNumber"`
	IsApproved     bool      `json:"isApproved"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	CreatedBy      string    `json:"createdBy"`
}

type Patient struct {
	PatientID      string    `json:"patientID"`
	UserID         string    `json:"userID"`
	IPFSURL        string    `json:"ipfsURL"`
	Name           string    `json:"name"`
	DOB            string    `json:"dob"`
	BloodGroup     string    `json:"bloodGroup"`
	MedicalHistory []string  `json:"medicalHistory"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	CreatedBy      string    `json:"createdBy"`
}

type Prescription struct {
	PrescriptionID string    `json:"prescriptionID"`
	DoctorID       string    `json:"doctorID"`
	PatientID      string    `json:"patientID"`
	Medicines      []string  `json:"medicines"`
	Instructions   string    `json:"instructions"`
	IssueDate      time.Time `json:"issueDate"`
	ExpiryDate     time.Time `json:"expiryDate"`
	CreatedBy      string    `json:"createdBy"`
}

type Appointment struct {
	AppointmentID   string    `json:"appointmentID"`
	DoctorID        string    `json:"doctorID"`
	PatientID       string    `json:"patientID"`
	AppointmentDate string    `json:"appointmentDate"`
	TimeSlot        string    `json:"timeSlot"`
	Reason          string    `json:"reason"`
	Status          string    `json:"status"` // scheduled | completed | cancelled
	CreatedAt       time.Time `json:"createdAt"`
	CreatedBy       string    `json:"createdBy"`
}

// ─── Contract ─────────────────────────────────────────────────────────────────

type HealthcareContract struct {
	contractapi.Contract
}

// ─── Doctor Functions ─────────────────────────────────────────────────────────

// AddDoctor registers a new doctor on the ledger.
func (hc *HealthcareContract) AddDoctor(
	ctx contractapi.TransactionContextInterface,
	doctorID, userID, ipfsURL, name, specialization, hospital, licenseNumber string,
) error {
	existing, _ := ctx.GetStub().GetState(doctorID)
	if existing != nil {
		return fmt.Errorf("doctor %s already exists", doctorID)
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	doctor := Doctor{
		DoctorID:       doctorID,
		UserID:         userID,
		IPFSURL:        ipfsURL,
		Name:           name,
		Specialization: specialization,
		Hospital:       hospital,
		LicenseNumber:  licenseNumber,
		IsApproved:     false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		CreatedBy:      clientID,
	}

	doctorJSON, err := json.Marshal(doctor)
	if err != nil {
		return fmt.Errorf("failed to marshal doctor: %v", err)
	}

	if err := ctx.GetStub().PutState(doctorID, doctorJSON); err != nil {
		return fmt.Errorf("failed to put state: %v", err)
	}

	return ctx.GetStub().SetEvent("DoctorAdded", doctorJSON)
}

// ApproveDoctor sets isApproved flag on a doctor record.
func (hc *HealthcareContract) ApproveDoctor(
	ctx contractapi.TransactionContextInterface,
	doctorID string,
) error {
	doctorJSON, err := ctx.GetStub().GetState(doctorID)
	if err != nil || doctorJSON == nil {
		return fmt.Errorf("doctor %s not found", doctorID)
	}

	var doctor Doctor
	if err := json.Unmarshal(doctorJSON, &doctor); err != nil {
		return err
	}

	doctor.IsApproved = true
	doctor.UpdatedAt = time.Now()

	updated, err := json.Marshal(doctor)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(doctorID, updated)
}

// QueryDoctor retrieves a doctor by ID.
func (hc *HealthcareContract) QueryDoctor(
	ctx contractapi.TransactionContextInterface,
	doctorID string,
) (*Doctor, error) {
	doctorJSON, err := ctx.GetStub().GetState(doctorID)
	if err != nil {
		return nil, fmt.Errorf("failed to read state: %v", err)
	}
	if doctorJSON == nil {
		return nil, fmt.Errorf("doctor not found: %s", doctorID)
	}

	var doctor Doctor
	if err := json.Unmarshal(doctorJSON, &doctor); err != nil {
		return nil, err
	}
	return &doctor, nil
}

// ─── Patient Functions ────────────────────────────────────────────────────────

// RegisterPatient creates a new patient record on the ledger.
func (hc *HealthcareContract) RegisterPatient(
	ctx contractapi.TransactionContextInterface,
	patientID, userID, ipfsURL, name, dob, bloodGroup string,
) error {
	existing, _ := ctx.GetStub().GetState(patientID)
	if existing != nil {
		return fmt.Errorf("patient %s already exists", patientID)
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	patient := Patient{
		PatientID:      patientID,
		UserID:         userID,
		IPFSURL:        ipfsURL,
		Name:           name,
		DOB:            dob,
		BloodGroup:     bloodGroup,
		MedicalHistory: []string{},
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		CreatedBy:      clientID,
	}

	patientJSON, err := json.Marshal(patient)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(patientID, patientJSON); err != nil {
		return fmt.Errorf("failed to put state: %v", err)
	}

	return ctx.GetStub().SetEvent("PatientRegistered", patientJSON)
}

// QueryPatient retrieves a patient by ID.
func (hc *HealthcareContract) QueryPatient(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) (*Patient, error) {
	patientJSON, err := ctx.GetStub().GetState(patientID)
	if err != nil {
		return nil, fmt.Errorf("failed to read state: %v", err)
	}
	if patientJSON == nil {
		return nil, fmt.Errorf("patient not found: %s", patientID)
	}

	var patient Patient
	if err := json.Unmarshal(patientJSON, &patient); err != nil {
		return nil, err
	}
	return &patient, nil
}

// QueryPatientHistory returns all prescription IDs linked to a patient.
func (hc *HealthcareContract) QueryPatientHistory(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) ([]string, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("patient~prescription", []string{patientID})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var prescriptions []string
	for iter.HasNext() {
		result, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, err := ctx.GetStub().SplitCompositeKey(result.Key)
		if err != nil {
			return nil, err
		}
		if len(parts) > 1 {
			prescriptions = append(prescriptions, parts[1])
		}
	}
	return prescriptions, nil
}

// ─── Prescription Functions ───────────────────────────────────────────────────

// IssuePrescription records a prescription on the ledger.
func (hc *HealthcareContract) IssuePrescription(
	ctx contractapi.TransactionContextInterface,
	prescriptionID, doctorID, patientID, medicinesJSON, instructions string,
	expiryDays int,
) error {
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	var medicines []string
	if err := json.Unmarshal([]byte(medicinesJSON), &medicines); err != nil {
		return fmt.Errorf("invalid medicines format: %v", err)
	}

	prescription := Prescription{
		PrescriptionID: prescriptionID,
		DoctorID:       doctorID,
		PatientID:      patientID,
		Medicines:      medicines,
		Instructions:   instructions,
		IssueDate:      time.Now(),
		ExpiryDate:     time.Now().AddDate(0, 0, expiryDays),
		CreatedBy:      clientID,
	}

	prescriptionJSON, err := json.Marshal(prescription)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(prescriptionID, prescriptionJSON); err != nil {
		return fmt.Errorf("failed to store prescription: %v", err)
	}

	// Create composite key to index by patient
	compositeKey, err := ctx.GetStub().CreateCompositeKey("patient~prescription", []string{patientID, prescriptionID})
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(compositeKey, []byte{0x00}); err != nil {
		return err
	}

	return ctx.GetStub().SetEvent("PrescriptionIssued", prescriptionJSON)
}

// QueryPrescription retrieves a prescription by ID.
func (hc *HealthcareContract) QueryPrescription(
	ctx contractapi.TransactionContextInterface,
	prescriptionID string,
) (*Prescription, error) {
	data, err := ctx.GetStub().GetState(prescriptionID)
	if err != nil {
		return nil, fmt.Errorf("failed to read state: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("prescription not found: %s", prescriptionID)
	}

	var p Prescription
	if err := json.Unmarshal(data, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// ─── Appointment Functions ────────────────────────────────────────────────────

// BookAppointment schedules an appointment on the ledger.
func (hc *HealthcareContract) BookAppointment(
	ctx contractapi.TransactionContextInterface,
	appointmentID, doctorID, patientID, appointmentDate, timeSlot, reason string,
) error {
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	appointment := Appointment{
		AppointmentID:   appointmentID,
		DoctorID:        doctorID,
		PatientID:       patientID,
		AppointmentDate: appointmentDate,
		TimeSlot:        timeSlot,
		Reason:          reason,
		Status:          "scheduled",
		CreatedAt:       time.Now(),
		CreatedBy:       clientID,
	}

	appointmentJSON, err := json.Marshal(appointment)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(appointmentID, appointmentJSON); err != nil {
		return fmt.Errorf("failed to book appointment: %v", err)
	}

	return ctx.GetStub().SetEvent("AppointmentBooked", appointmentJSON)
}

// UpdateAppointmentStatus changes status of an appointment.
func (hc *HealthcareContract) UpdateAppointmentStatus(
	ctx contractapi.TransactionContextInterface,
	appointmentID, status string,
) error {
	data, err := ctx.GetStub().GetState(appointmentID)
	if err != nil || data == nil {
		return fmt.Errorf("appointment %s not found", appointmentID)
	}

	var apt Appointment
	if err := json.Unmarshal(data, &apt); err != nil {
		return err
	}

	apt.Status = status
	updated, err := json.Marshal(apt)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(appointmentID, updated)
}

// QueryAppointment retrieves an appointment by ID.
func (hc *HealthcareContract) QueryAppointment(
	ctx contractapi.TransactionContextInterface,
	appointmentID string,
) (*Appointment, error) {
	data, err := ctx.GetStub().GetState(appointmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to read state: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("appointment not found: %s", appointmentID)
	}

	var a Appointment
	if err := json.Unmarshal(data, &a); err != nil {
		return nil, err
	}
	return &a, nil
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

func main() {
	cc, err := contractapi.NewChaincode(&HealthcareContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating healthcare chaincode: %v", err))
	}
	if err := cc.Start(); err != nil {
		panic(fmt.Sprintf("Error starting healthcare chaincode: %v", err))
	}
}
