import { z } from "zod";

// Define the schema
export const additionalQuotationSchema = z.object({
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
});


export const additionalQuotationFormSchemaSection = z.object({
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
    quJobCard: z.string().refine((value) => value.trim() !== "", {
      message: "Job card is required",
    }),
  
    qudaystocomplete: z.string().refine((value) => value.trim() !== "", {
      message: "Days to complete is required",
    }),
  
    sectionItems: z.array(
      z.object({
        sectionName: z.string().refine((value) => value.trim() !== "", {
          message: " name required",
        }),
        itemsList: z.array(
          z.object({
            itemName: z.string().refine((value) => value.trim() !== "", {
              message: "name is required",
            })
          })
        ),
        price: z.string().refine((value) => value.trim() !== "", {
          message: "price is required",
        }),
      })
    ),
  
    quStatus: z.string().optional(),
  
   
  
  });
  