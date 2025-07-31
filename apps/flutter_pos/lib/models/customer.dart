class Customer {
  final String id;
  final String? email;
  final String? firstName;
  final String? lastName;
  final String? phoneNumber;
  final String merchantId;

  Customer({
    required this.id,
    this.email,
    this.firstName,
    this.lastName,
    this.phoneNumber,
    required this.merchantId,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phoneNumber: json['phone_number'],
      merchantId: json['merchant_id'],
    );
  }

  String get displayName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    } else if (firstName != null) {
      return firstName!;
    } else if (lastName != null) {
      return lastName!;
    } else if (phoneNumber != null) {
      return phoneNumber!;
    } else if (email != null) {
      return email!;
    } else {
      return 'Customer';
    }
  }
} 