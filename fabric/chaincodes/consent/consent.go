package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ConsentRecord represents a patient's consent grant or revocation.
type ConsentRecord struct {
	ConsentID string `json:"consentID"`
	PatientID string `json:"patientID"`
	GrantedTo string `json:"grantedTo"` // doctorID, hospitalID, insuranceID, etc.
	DataType  string `json:"dataType"`  // "medical_records" | "prescriptions" | "appointments" | "all"
	IsGranted bool   `json:"isGranted"`
	GrantedAt string `json:"grantedAt"`
	RevokedAt string `json:"revokedAt,omitempty"`
	ExpiresAt string `json:"expiresAt,omitempty"`
	CreatedBy string `json:"createdBy"`
}

// ConsentContract manages patient data-sharing consents.
type ConsentContract struct {
	contractapi.Contract
}

// GrantConsent creates or updates a consent record.
func (c *ConsentContract) GrantConsent(
	ctx contractapi.TransactionContextInterface,
	consentID, patientID, grantedTo, dataType string,
	expiryDays int,
) error {
	clientID, _ := ctx.GetClientIdentity().GetID()

	now := time.Now().UTC()
	consent := ConsentRecord{
		ConsentID: consentID,
		PatientID: patientID,
		GrantedTo: grantedTo,
		DataType:  dataType,
		IsGranted: true,
		GrantedAt: now.Format(time.RFC3339),
		CreatedBy: clientID,
	}

	if expiryDays > 0 {
		consent.ExpiresAt = now.AddDate(0, 0, expiryDays).Format(time.RFC3339)
	}

	data, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(consentID, data); err != nil {
		return fmt.Errorf("failed to store consent: %v", err)
	}

	return ctx.GetStub().SetEvent("ConsentGranted", data)
}

// RevokeConsent marks a consent record as revoked.
func (c *ConsentContract) RevokeConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) error {
	data, err := ctx.GetStub().GetState(consentID)
	if err != nil || data == nil {
		return fmt.Errorf("consent %s not found", consentID)
	}

	var consent ConsentRecord
	if err := json.Unmarshal(data, &consent); err != nil {
		return err
	}

	consent.IsGranted = false
	consent.RevokedAt = time.Now().UTC().Format(time.RFC3339)

	updated, err := json.Marshal(consent)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(consentID, updated); err != nil {
		return err
	}

	return ctx.GetStub().SetEvent("ConsentRevoked", updated)
}

// CheckConsent verifies whether a consent is currently active.
func (c *ConsentContract) CheckConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) (bool, error) {
	data, err := ctx.GetStub().GetState(consentID)
	if err != nil || data == nil {
		return false, nil
	}

	var consent ConsentRecord
	if err := json.Unmarshal(data, &consent); err != nil {
		return false, err
	}

	if !consent.IsGranted {
		return false, nil
	}
	if consent.ExpiresAt != "" {
		expiresAt, err := time.Parse(time.RFC3339, consent.ExpiresAt)
		if err == nil && time.Now().UTC().After(expiresAt) {
			return false, nil
		}
	}
	return true, nil
}

// QueryConsent retrieves a consent record by ID.
func (c *ConsentContract) QueryConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) (*ConsentRecord, error) {
	data, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return nil, fmt.Errorf("failed to read: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("consent not found: %s", consentID)
	}

	var consent ConsentRecord
	if err := json.Unmarshal(data, &consent); err != nil {
		return nil, err
	}
	return &consent, nil
}

func main() {
	cc, err := contractapi.NewChaincode(&ConsentContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating consent chaincode: %v", err))
	}
	if err := cc.Start(); err != nil {
		panic(fmt.Sprintf("Error starting consent chaincode: %v", err))
	}
}
