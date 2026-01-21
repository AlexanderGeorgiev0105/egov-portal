package com.example.demo.dto;

import java.time.LocalDate;
import java.util.List;

import com.example.demo.domain.DocumentType;

public class CreateDocumentAddRequestData {
    public DocumentType type;

    public String firstName;
    public String middleName;
    public String lastName;

    public String egn;
    public String gender; // male/female/other
    public LocalDate dob;

    public LocalDate validUntil;
    public String docNumber; // 9 digits

    public String birthPlace;
    public String address;
    public String issuedAt;

    public List<String> categories; // only for DRIVER_LICENSE
}
