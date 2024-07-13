import { z } from "zod";

// Define the schema
export const quotaionFormSchema = z.object({
  quDateAndTime: z
    .string()
    .refine((value) => value.trim() !== "", {
      message: "date required",
    })
    .transform((str) => new Date(str)),
  quCustomer: z.string().refine((value) => value.trim() !== "", {
    message: "customer is required",
  }),
  quCar: z.string().refine((value) => value.trim() !== "", {
    message: "car is required",
  }),
  quInsuranceCom: z.string().refine((value) => value.trim() !== "", {
    message: "insurance Company is required",
  }),
  quCustomerCareRepresentative: z
    .string()
    .refine((value) => value.trim() !== "", {
      message: "customer care representative is required",
    }),
  quJobCard: z.string().refine((value) => value.trim() !== "", {
    message: "job-card is required",
  }),
  qudaystocomplete: z.string().refine((value) => value.trim() !== "", {
    message: "days to quote  is required",
  }),
  itemList: z.array(
    z.object({
      itemName: z.string().refine((value) => value.trim() !== "", {
        message: "item Name is required",
      }),
      itemPrice: z
        .string()
        .refine((value) => value.trim() !== "", {
          message: "item Price is required",
        })
        .refine(
          (value) => {
            return /^\d+(\.\d{1,2})?$/.test(value);
          },
          {
            message: "valid price",
          }
        ),
    })
  ),
  quStatus: z.string().optional(), 
  quoLpo: z.array(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.quStatus === 'Approved' && (!data.quoLpo || data.quoLpo.length === 0)) {
    ctx.addIssue({
      path: ['quoLpo'],
      message: 'LPO required when status is Approved',
    });
  }

});


//new scema



// Define the schema
export const quotationFormSchemaSection = z.object({
  quDateAndTime: z
    .string()
    .refine((value) => value.trim() !== "", {
      message: "Date and time is required",
    })
    .transform((str) => new Date(str)), // Transform the string to a Date object

  quCustomer: z.string().refine((value) => value.trim() !== "", {
    message: "Customer is required",
  }),

  quCar: z.string().refine((value) => value.trim() !== "", {
    message: "Car is required",
  }),

  quInsuranceCom: z.string().refine((value) => value.trim() !== "", {
    message: "Insurance Company is required",
  }),

  quCustomerCareRepresentative: z.string().refine((value) => value.trim() !== "", {
    message: "Customer care representative is required",
  }),

  quJobCard: z.string().refine((value) => value.trim() !== "", {
    message: "Job card is required",
  }),

  qudaystocomplete: z.string().refine((value) => value.trim() !== "", {
    message: "Days to complete is required",
  }),

  sectionItems: z.array(
    z.object({
      itemsList: z.array(
        z.object({
          itemName: z.string().optional(),
        })
      ),
      price: z.string().optional(),
    })
  ),

  quStatus: z.string().optional(),

  quoLpo: z.array(z.any()).optional(), // Array of any type, adjust as per actual type

}).superRefine((data, ctx) => {
  if (data.quStatus === "Approved" && (!data.quoLpo || data.quoLpo.length === 0)) {
    ctx.addIssue({
      path: ["quoLpo"],
      message: "LPO required when status is Approved",
    });
  }
});
