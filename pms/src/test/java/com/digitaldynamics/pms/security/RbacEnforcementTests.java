package com.digitaldynamics.pms.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class RbacEnforcementTests {
    private static final String PASSWORD = "Password123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void protectedApiRequiresAuthentication() throws Exception {
        int status = mockMvc.perform(get("/api/dashboard"))
                .andReturn()
                .getResponse()
                .getStatus();

        assertThat(status).isIn(401, 403);
    }

    @Test
    void adminOnlyUserManagementRejectsRequesterAndAllowsAdmin() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("admin@digitaldynamics.co.za")))
                .andExpect(status().isOk());
    }

    @Test
    void requesterCanCreateRequisitionButProcurementOfficerCannot() throws Exception {
        String payload = """
                {
                  "title": "RBAC test requisition",
                  "businessJustification": "Verify requester-only write access",
                  "items": [
                    {
                      "description": "Laptop",
                      "quantity": 1,
                      "estimatedUnitPrice": 1000.00
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/requisitions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("procurement@digitaldynamics.co.za"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/requisitions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void procurementOfficerCanCreateSupplierButRequesterCannot() throws Exception {
        String payload = """
                {
                  "name": "RBAC Supplier",
                  "contactEmail": "rbac-supplier@example.com",
                  "performanceScore": 80
                }
                """;

        mockMvc.perform(post("/api/suppliers")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/suppliers")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("procurement@digitaldynamics.co.za"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    @Test
    void approverCanViewApprovalsButRequesterCannot() throws Exception {
        mockMvc.perform(get("/api/approvals")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/approvals")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("approver1@digitaldynamics.co.za")))
                .andExpect(status().isOk());
    }

    @Test
    void receivingClerkCanViewPurchaseOrdersButRequesterCannot() throws Exception {
        mockMvc.perform(get("/api/purchase-orders")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/purchase-orders")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("receiving@digitaldynamics.co.za")))
                .andExpect(status().isOk());
    }

    @Test
    void quotationSubmissionEndpointIsPublicByDesign() throws Exception {
        String payload = """
                {
                  "rfqId": 999999,
                  "supplierId": 999999,
                  "totalAmount": 100.00,
                  "deliveryDays": 5,
                  "qualityScore": 80,
                  "termsScore": 80
                }
                """;

        int status = mockMvc.perform(post("/api/quotations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andReturn()
                .getResponse()
                .getStatus();

        assertThat(status).isNotIn(401, 403);
    }

    @Test
    void nonAdminCannotReadOtherUserById() throws Exception {
        String adminToken = bearerToken("admin@digitaldynamics.co.za");
        JsonNode users = objectMapper.readTree(mockMvc.perform(get("/api/users")
                        .header(HttpHeaders.AUTHORIZATION, adminToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString());

        long adminId = users.get(0).get("id").asLong();

        mockMvc.perform(get("/api/users/{id}", adminId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken("requester@digitaldynamics.co.za")))
                .andExpect(status().isForbidden());
    }

    private String bearerToken(String email) throws Exception {
        String payload = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, PASSWORD);

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        return "Bearer " + json.get("token").asText();
    }
}
