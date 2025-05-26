class Reward {
  final String id;
  final String name;
  final String description;
  final String imagePath;
  final int priceCoins;
  final bool isActive;

  Reward({
    required this.id,
    required this.name,
    required this.description,
    required this.imagePath,
    required this.priceCoins,
    required this.isActive,
  });

  factory Reward.fromJson(Map<String, dynamic> json) {
    return Reward(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      imagePath: json['image_path'],
      priceCoins: json['price_coins'],
      isActive: json['is_active'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image_path': imagePath,
      'price_coins': priceCoins,
      'is_active': isActive,
    };
  }
} 