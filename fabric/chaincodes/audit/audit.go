package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// AuditEntry is an immutable audit trail record.
type AuditEntry struct {
	AuditID     string    `json:"auditID"`
	ActorID     string    `json:"actorID"`     // userID or Fabric clientID
	Action      string    `json:"action"`      // "CREATE" | "UPDATE" | "DELETE" | "ACCESS"
	ResourceID  string    `json:"resourceID"`  // doctorID, patientID, prescriptionID, etc.
	ResourceType string   `json:"resourceType"` // "doctor" | "patient" | "prescription" | "appointment"
	Details     string    `json:"details"`
	TxID        string    `json:"txID"`        // Fabric transaction ID
	Timestamp   time.Time `json:"timestamp"`
}

// AuditContract provides an immutable audit trail.
type AuditContract struct {
	contractapi.Contract
}

// LogAction records an audit entry. Once written, it cannot be modified.
func (a *AuditContract) LogAction(
	ctx contractapi.TransactionContextInterface,
	auditID, actorID, action, resourceID, resourceType, details string,
) error {
	// Prevent overwrite
	existing, _ := ctx.GetStub().GetState(auditID)
	if existing != nil {
		return fmt.Errorf("audit entry %s already exists (immutable)", auditID)
	}

	entry := AuditEntry{
		AuditID:      auditID,
		ActorID:      actorID,
		Action:       action,
		ResourceID:   resourceID,
		ResourceType: resourceType,
		Details:      details,
		TxID:         ctx.GetStub().GetTxID(),
		Timestamp:    time.Now(),
	}

	data, err := json.Marshal(entry)
	if err != nil {
		return err
	}

	if err := ctx.GetStub().PutState(auditID, data); err != nil {
		return fmt.Errorf("failed to store audit entry: %v", err)
	}

	// Index by actor for range queries
	compositeKey, _ := ctx.GetStub().CreateCompositeKey("actor~audit", []string{actorID, auditID})
	ctx.GetStub().PutState(compositeKey, []byte{0x00})

	// Index by resource for range queries
	resKey, _ := ctx.GetStub().CreateCompositeKey("resource~audit", []string{resourceID, auditID})
	ctx.GetStub().PutState(resKey, []byte{0x00})

	return ctx.GetStub().SetEvent("AuditLogged", data)
}

// QueryAudit retrieves an audit entry by ID.
func (a *AuditContract) QueryAudit(
	ctx contractapi.TransactionContextInterface,
	auditID string,
) (*AuditEntry, error) {
	data, err := ctx.GetStub().GetState(auditID)
	if err != nil {
		return nil, fmt.Errorf("failed to read: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("audit entry not found: %s", auditID)
	}

	var entry AuditEntry
	if err := json.Unmarshal(data, &entry); err != nil {
		return nil, err
	}
	return &entry, nil
}

// QueryAuditsByResource returns all audit IDs for a given resource.
func (a *AuditContract) QueryAuditsByResource(
	ctx contractapi.TransactionContextInterface,
	resourceID string,
) ([]string, error) {
	iter, err := ctx.GetStub().GetStateByPartialCompositeKey("resource~audit", []string{resourceID})
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	var ids []string
	for iter.HasNext() {
		result, err := iter.Next()
		if err != nil {
			return nil, err
		}
		_, parts, _ := ctx.GetStub().SplitCompositeKey(result.Key)
		if len(parts) > 1 {
			ids = append(ids, parts[1])
		}
	}
	return ids, nil
}

func main() {
	cc, err := contractapi.NewChaincode(&AuditContract{})
	if err != nil {
		panic(fmt.Sprintf("Error creating audit chaincode: %v", err))
	}
	if err := cc.Start(); err != nil {
		panic(fmt.Sprintf("Error starting audit chaincode: %v", err))
	}
}
