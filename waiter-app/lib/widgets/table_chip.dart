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
    final isOccupied = table.status == 'OCCUPIED';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 80,
        height: 70,
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary
              : (isOccupied ? AppColors.warningSoft : AppColors.surface),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected
                ? AppColors.primary
                : (isOccupied ? AppColors.warning.withOpacity(0.3) : AppColors.border),
            width: 1.5,
          ),
          boxShadow: selected ? [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ] : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${table.number}',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: selected ? Colors.white : AppColors.textPrimary,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: selected ? Colors.white.withOpacity(0.5) : _statusColor,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
