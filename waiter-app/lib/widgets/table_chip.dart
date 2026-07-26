import 'package:flutter/material.dart';
import '../models/table.dart';
import '../theme/app_theme.dart';

class TableChip extends StatelessWidget {
  final DiningTable table;
  final bool selected;
  final VoidCallback onTap;

  const TableChip({
    super.key,
    required this.table,
    required this.selected,
    required this.onTap,
  });

  Color get _statusColor {
    switch (table.status) {
      case 'OCCUPIED':
        return AppColors.warning;
      case 'RESERVED':
        return AppColors.danger;
      default:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? AppColors.textPrimary : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? AppColors.textPrimary : AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(color: _statusColor, shape: BoxShape.circle),
            ),
            const SizedBox(width: 8),
            Text(
              'Table ${table.number}',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: selected ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
